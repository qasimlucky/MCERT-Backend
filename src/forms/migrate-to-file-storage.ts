import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Form } from './entities/form.entity';
import { FileStorageService } from './file-storage.service';

@Injectable()
export class FileStorageMigrationService {
  constructor(
    @InjectModel(Form.name) private readonly formModel: Model<Form>,
    @InjectConnection() private connection: Connection,
    private readonly fileStorageService: FileStorageService,
  ) {}

  /**
   * Migrate all existing forms to file storage
   */
  async migrateAllFormsToFileStorage(): Promise<{
    totalForms: number;
    migratedForms: number;
    failedForms: number;
    errors: string[];
  }> {
    console.log('Starting migration to file storage...');
    
    const errors: string[] = [];
    let migratedForms = 0;
    let failedForms = 0;

    try {
      // Find all forms that are not already using file storage
      const formsToMigrate = await this.formModel.find({
        $or: [
          { storageMethod: { $ne: 'file' } },
          { filePath: { $exists: false } },
          { filePath: null }
        ]
      }).exec();

      console.log(`Found ${formsToMigrate.length} forms to migrate`);

      for (const form of formsToMigrate) {
        try {
          await this.migrateSingleForm(form);
          migratedForms++;
          
          if (migratedForms % 10 === 0) {
            console.log(`Migrated ${migratedForms}/${formsToMigrate.length} forms...`);
          }
        } catch (error) {
          failedForms++;
          const errorMsg = `Failed to migrate form ${form._id}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`Migration completed: ${migratedForms} migrated, ${failedForms} failed`);

      return {
        totalForms: formsToMigrate.length,
        migratedForms,
        failedForms,
        errors
      };
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Migrate a single form to file storage
   */
  private async migrateSingleForm(form: any): Promise<void> {
    let formData: any = null;

    // Extract form data based on current storage method
    switch (form.storageMethod) {
      case 'direct':
        formData = form.formData;
        break;
      case 'compressed':
        if (form.compressedData) {
          const decompressed = require('zlib').gunzipSync(form.compressedData);
          formData = JSON.parse(decompressed.toString());
        }
        break;
      case 'chunked':
        formData = await this.retrieveFromChunks(form.chunkedDataId);
        break;
      case 'gridfs':
        formData = await this.retrieveFromGridFS(form.gridFSFileId);
        break;
      default:
        formData = form.formData;
    }

    if (!formData) {
      throw new Error('No form data found to migrate');
    }

    // Store form data as file
    const formId = form._id.toString();
    const fileResult = await this.fileStorageService.storeFormData(formId, formData, {
      compress: JSON.stringify(formData).length > 1024 * 1024, // Compress if > 1MB
      format: 'json'
    });

    // Update form document
    await this.formModel.updateOne(
      { _id: form._id },
      {
        $set: {
          filePath: fileResult.filePath,
          fileName: fileResult.filePath.split('/').pop(),
          isCompressed: fileResult.compressed,
          fileSize: fileResult.fileSize,
          storageMethod: 'file'
        },
        $unset: {
          formData: 1,
          compressedData: 1,
          gridFSFileId: 1,
          chunkedDataId: 1,
          isLargeData: 1
        }
      }
    );

    console.log(`Migrated form ${form._id} to file: ${fileResult.filePath}`);
  }

  /**
   * Verify migration by checking file integrity
   */
  async verifyMigration(): Promise<{
    totalForms: number;
    validFiles: number;
    invalidFiles: number;
    missingFiles: number;
  }> {
    console.log('Verifying file storage migration...');

    const forms = await this.formModel.find({ storageMethod: 'file' }).exec();
    let validFiles = 0;
    let invalidFiles = 0;
    let missingFiles = 0;

    for (const form of forms) {
      try {
        if (!form.filePath) {
          missingFiles++;
          continue;
        }

        // Try to retrieve data from file
        const data = await this.fileStorageService.retrieveFormData(
          form.filePath, 
          form.isCompressed
        );

        if (data) {
          validFiles++;
        } else {
          invalidFiles++;
        }
      } catch (error) {
        invalidFiles++;
        console.error(`Invalid file for form ${form._id}: ${error.message}`);
      }
    }

    console.log(`Verification completed: ${validFiles} valid, ${invalidFiles} invalid, ${missingFiles} missing`);

    return {
      totalForms: forms.length,
      validFiles,
      invalidFiles,
      missingFiles
    };
  }

  /**
   * Clean up old storage methods after successful migration
   */
  async cleanupOldStorage(): Promise<void> {
    console.log('Cleaning up old storage methods...');

    try {
      // Remove old GridFS files
      const gridFSForms = await this.formModel.find({ 
        storageMethod: 'file',
        gridFSFileId: { $exists: true, $ne: null }
      }).exec();

      for (const form of gridFSForms) {
        try {
          await this.deleteFromGridFS(form.gridFSFileId);
          await this.formModel.updateOne(
            { _id: form._id },
            { $unset: { gridFSFileId: 1 } }
          );
        } catch (error) {
          console.error(`Failed to cleanup GridFS file for form ${form._id}: ${error.message}`);
        }
      }

      // Remove old chunked data
      const chunkedForms = await this.formModel.find({ 
        storageMethod: 'file',
        chunkedDataId: { $exists: true, $ne: null }
      }).exec();

      for (const form of chunkedForms) {
        try {
          await this.connection.db.collection('formChunks').deleteMany({ formId: form.chunkedDataId });
          await this.formModel.updateOne(
            { _id: form._id },
            { $unset: { chunkedDataId: 1 } }
          );
        } catch (error) {
          console.error(`Failed to cleanup chunked data for form ${form._id}: ${error.message}`);
        }
      }

      console.log('Old storage cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  // Helper methods for retrieving data from old storage methods
  private async retrieveFromChunks(chunkedDataId: string): Promise<any> {
    const chunks = await this.connection.db.collection('formChunks')
      .find({ formId: chunkedDataId })
      .sort({ chunkIndex: 1 })
      .toArray();
    
    const data = chunks.map(chunk => chunk.data).join('');
    return JSON.parse(data);
  }

  private async retrieveFromGridFS(fileId: string): Promise<any> {
    // Implementation would depend on your GridFS setup
    // This is a placeholder
    throw new Error('GridFS retrieval not implemented in migration script');
  }

  private async deleteFromGridFS(fileId: string): Promise<void> {
    // Implementation would depend on your GridFS setup
    // This is a placeholder
    console.log(`Would delete GridFS file: ${fileId}`);
  }
}
