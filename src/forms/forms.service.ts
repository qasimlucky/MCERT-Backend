import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import * as zlib from 'zlib';
import { FileStorageService } from './file-storage.service';
import { Form } from './entities/form.entity';
import { 
  CreateFormDto, 
  UpdateFormDto, 
  FormSubmissionDto,
  FormResponseDto,
  PaginationDto,
  PaginatedFormsDto,
  FormQueryDto,
  ApiResponseDto,
  FormCreationResponseDto,
  BulkUpdateFormDto,
  BulkDeleteFormDto
} from './dto/mcerts-forms.dto';
import { 
  InspectionListQueryDto, 
  InspectionListResponseDto,
  InspectionListItemDto 
} from './dto/inspection-list.dto';

@Injectable()
export class FormsService {
  private gridFSBucket: GridFSBucket;
  private readonly MAX_DIRECT_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB - increased limit with compression

  constructor(
    @InjectModel(Form.name) private readonly formModel: Model<Form>,
    @InjectConnection() private connection: Connection,
    private readonly fileStorageService: FileStorageService,
  ) {
    // Initialize GridFS bucket with optimized settings for large files
    this.gridFSBucket = new GridFSBucket(this.connection.db as any, {
      bucketName: 'formData',
      chunkSizeBytes: 2 * 1024 * 1024, // 2MB chunks to reduce chunk count
    });
  }

  async create(createFormDto: CreateFormDto): Promise<FormCreationResponseDto> {
    try {
      // Validate required fields
      if (!createFormDto.userId) {
        throw new Error('userId is required');
      }

      // Convert userId to ObjectId if it's a string
      const userId = typeof createFormDto.userId === 'string' 
        ? new Types.ObjectId(createFormDto.userId) 
        : createFormDto.userId;

      // Optimize payload size calculation - only serialize if needed
      let payloadSize = 0;
      let formData = createFormDto.formData;
      
      if (formData) {
        // Quick size estimation without full JSON.stringify
        const dataString = JSON.stringify(formData);
        payloadSize = dataString.length;
        
        // Log only if size is significant
        if (payloadSize > 1024 * 1024) { // Only log if > 1MB
      console.log(`Payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      let formDocument: any = {
        userId: userId,
        status: createFormDto.status || 'pending',
        dataSize: payloadSize,
        storageMethod: 'file',
      };

      // Store ALL form data as files on server (fastest and most consistent approach)
      const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileResult = await this.fileStorageService.storeFormData(formId, formData, {
        compress: payloadSize > 1 * 1024 * 1024, // Compress if > 1MB for better performance
        format: 'json'
      });

      formDocument.filePath = fileResult.filePath;
      formDocument.fileName = fileResult.filePath.split('/').pop();
      formDocument.isCompressed = fileResult.compressed;
      formDocument.fileSize = fileResult.fileSize;
      formDocument.storageMethod = 'file';
      
      console.log(`Form data stored as file: ${formDocument.fileName} (${(fileResult.fileSize / 1024 / 1024).toFixed(2)}MB, compressed: ${fileResult.compressed})`);

      // Save form without populate to avoid extra query
      const savedForm = await this.formModel.create(formDocument);

      return {
        success: true,
        data: {
          _id: savedForm._id,
          userId: savedForm.userId,
          status: savedForm.status,
          dataSize: savedForm.dataSize,
          storageMethod: savedForm.storageMethod,
          chunkedDataId: savedForm.chunkedDataId,
          gridFSFileId: savedForm.gridFSFileId,
          createdAt: savedForm.createdAt,
          updatedAt: savedForm.updatedAt
        },
        message: 'MCERTS form created successfully'
      };
    } catch (error) {
      console.error('Error creating MCERTS form:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create MCERTS form'
      };
    }
  }

  async findAll(): Promise<any[]> {
    const forms = await this.formModel.find().populate('userId').exec();

    // Process each form to include data from files
    for (const form of forms) {
      try {
        form.formData = await this.getFormData(form);
      } catch (error) {
        console.error(`Error retrieving form data for ${form._id}:`, error);
        form.formData = null;
      }
    }

    return forms;
  }

  // Get form with data (including file data)
  async findOneWithData(id: string): Promise<any> {
    const form = await this.formModel.findById(id).populate('userId').exec();
    
    if (!form) {
      throw new NotFoundException(`Form with ID ${id} not found`);
    }

    // Retrieve form data from file (primary method)
    try {
      form.formData = await this.getFormData(form);
    } catch (error) {
      console.error(`Error retrieving form data for ${form._id}:`, error);
      throw new Error(`Failed to retrieve form data: ${error.message}`);
    }

    return form;
  }

  // Migration method to convert existing forms to file storage
  async migrateToFileStorage(): Promise<{
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

  private async migrateSingleForm(form: any): Promise<void> {
    let formData: any = null;

    // Extract form data based on current storage method
    switch (form.storageMethod) {
      case 'direct':
        formData = form.formData;
        break;
      case 'compressed':
        if (form.compressedData) {
          formData = this.decompressData(form.compressedData);
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

  // Legacy method for backward compatibility
  async findAllLegacy(): Promise<any[]> {
    const forms = await this.formModel.find().populate('userId').exec();
    const processedForms = [];
    
    for (const form of forms) {
      if (form.isLargeData && form.gridFSFileId) {
        try {
          const formData = await this.retrieveFromGridFS(form.gridFSFileId);
          processedForms.push({ ...form.toObject(), formData });
        } catch (error) {
          processedForms.push({
            ...form.toObject(),
            formData: null,
            _gridfsError: 'Failed to retrieve form data from storage',
          });
        }
      } else {
        processedForms.push(form);
      }
    }

    return processedForms;
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedFormsDto> {
    const startTime = Date.now();
    const { page, limit, sortBy, sortOrder, search, status } = paginationDto;
    const includeFormData = true;
    // Build query filters
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      // Search in populated user fields and form status
      query.$or = [
        { status: { $regex: search, $options: 'i' } },
        // We'll need to handle user search differently due to population
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const total = await this.formModel.countDocuments(query);

    // Execute paginated query
    const formsQuery = this.formModel
      .find(query)
      .populate('userId')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const forms = await formsQuery.exec();
    console.log(
      `Retrieved ${forms.length} forms for pagination. includeFormData: ${includeFormData}`,
    );

    // Process forms based on includeFormData flag - using parallel processing for GridFS retrieval
    console.log(`Starting parallel processing of ${forms.length} forms`);

    const processedForms = await Promise.all(
      forms.map(async (form) => {
        console.log(
          `Processing form ${form._id} - isLargeData: ${form.isLargeData}, hasGridFSFileId: ${!!form.gridFSFileId}, dataSize: ${form.dataSize}`,
        );

        if (includeFormData && form.isLargeData && form.gridFSFileId) {
          console.log(
            `Processing large form data - gridFSFileId: ${form.gridFSFileId}, dataSize: ${form.dataSize}`,
          );
          try {
            const formData = await this.retrieveFromGridFS(form.gridFSFileId);
            console.log(
              `Successfully retrieved GridFS data for form ${form._id}`,
            );
            return { ...form.toObject(), formData };
          } catch (error) {
            console.error(
              `Failed to retrieve GridFS data for form ${form._id}:`,
              error,
            );
            return {
              ...form.toObject(),
              formData: null,
              _gridfsError: 'Failed to retrieve form data from storage',
            };
          }
        } else if (includeFormData) {
          // Include form data if it's stored directly (non-large data)
          console.log(
            `Processing small form data - isLargeData: ${form.isLargeData}, hasFormData: ${!!form.formData}, gridFSFileId: ${form.gridFSFileId}`,
          );
          return form.toObject();
        } else {
          // For performance, don't retrieve GridFS data by default
          if (form.isLargeData) {
            return {
              ...form.toObject(),
              formData: null,
              _hasLargeData: true,
              _dataSize: `${(form.dataSize / 1024 / 1024).toFixed(2)}MB`,
            };
          } else {
            return form.toObject();
          }
        }
      }),
    );

    console.log(
      `Completed parallel processing of ${processedForms.length} forms`,
    );

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response = {
      data: processedForms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        search,
        status,
        sortBy,
        sortOrder,
      },
    };

    // Log response size for debugging
    const responseSize = JSON.stringify(response).length;
    console.log(
      `Response size: ${(responseSize / 1024 / 1024).toFixed(2)}MB (${responseSize} bytes)`,
    );
    console.log(
      `Returning pagination response with ${processedForms.length} forms`,
    );

    // Check for potential issues
    if (responseSize > 50 * 1024 * 1024) {
      // 50MB
      console.warn(
        '⚠️  Response size is very large (>50MB), this might cause issues',
      );
    }

    // Validate response structure
    if (!response.data || !Array.isArray(response.data)) {
      console.error('❌ Invalid response structure - data is not an array');
    }

    // Log total processing time
    const totalTime = Date.now() - startTime;
    console.log(`⏱️  Total processing time: ${totalTime}ms`);

    return response;
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }

    const form = await this.formModel.findById(id).populate('userId').exec();
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // If data is stored in GridFS, retrieve it
    if (form.isLargeData && form.gridFSFileId) {
      console.log('Retrieving large form data from GridFS');
      try {
        const formData = await this.retrieveFromGridFS(form.gridFSFileId);
        return { ...form.toObject(), formData };
      } catch (error) {
        console.error('Failed to retrieve GridFS data:', error);
        // Return form without formData if GridFS retrieval fails
        return {
          ...form.toObject(),
          formData: null,
          _gridfsError: 'Failed to retrieve form data from storage',
        };
      }
    }

    return form;
  }

  async findByUserId(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const forms = await this.formModel
      .find({ userId: userId })
      .populate('userId')
      .exec();

    // For performance, don't retrieve GridFS data in list operations
    // Return forms with metadata only, client can call findOne for full data
    return forms.map((form) => {
      if (form.isLargeData) {
        return {
          ...form.toObject(),
          formData: null,
          _hasLargeData: true,
          _dataSize: `${(form.dataSize / 1024 / 1024).toFixed(2)}MB`,
        };
      }
      return form;
    });
  }

  async findByUserIdPaginated(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedFormsDto> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const { page, limit, sortBy, sortOrder, search, status, includeFormData } =
      paginationDto;

    // Build query filters
    const query: any = { userId: new Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [{ status: { $regex: search, $options: 'i' } }];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const total = await this.formModel.countDocuments(query);

    // Execute paginated query
    const forms = await this.formModel
      .find(query)
      .populate('userId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Process forms based on includeFormData flag - using parallel processing for GridFS retrieval
    console.log(`Starting parallel processing of ${forms.length} user forms`);

    const processedForms = await Promise.all(
      forms.map(async (form) => {
        if (includeFormData && form.isLargeData && form.gridFSFileId) {
          try {
            const formData = await this.retrieveFromGridFS(form.gridFSFileId);
            return { ...form.toObject(), formData };
          } catch (error) {
            console.error(
              `Failed to retrieve GridFS data for form ${form._id}:`,
              error,
            );
            return {
              ...form.toObject(),
              formData: null,
              _gridfsError: 'Failed to retrieve form data from storage',
            };
          }
        } else if (includeFormData) {
          return form.toObject();
        } else {
          // For performance, don't retrieve GridFS data by default
          if (form.isLargeData) {
            return {
              ...form.toObject(),
              formData: null,
              _hasLargeData: true,
              _dataSize: `${(form.dataSize / 1024 / 1024).toFixed(2)}MB`,
            };
          } else {
            return form.toObject();
          }
        }
      }),
    );

    console.log(
      `Completed parallel processing of ${processedForms.length} user forms`,
    );

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response = {
      data: processedForms,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        search,
        status,
        sortBy,
        sortOrder,
      },
    };

    // Log response size for debugging
    const responseSize = JSON.stringify(response).length;
    console.log(
      `User forms response size: ${(responseSize / 1024 / 1024).toFixed(2)}MB (${responseSize} bytes)`,
    );
    console.log(
      `Returning user pagination response with ${processedForms.length} forms`,
    );

    return response;
  }

  async update(id: string, updateFormDto: UpdateFormDto): Promise<Form> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }

    const existingForm = await this.formModel.findById(id);
    if (!existingForm) {
      throw new NotFoundException('Form not found');
    }

    // If updating form data, handle size-based storage
    if (updateFormDto.formData) {
      const payloadSize = JSON.stringify(updateFormDto.formData).length;
      console.log(
        `Update payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`,
      );

      // Clean up old GridFS data if it exists
      if (existingForm.isLargeData && existingForm.gridFSFileId) {
        await this.deleteFromGridFS(existingForm.gridFSFileId);
      }

      // Decide new storage method
      if (payloadSize > this.MAX_DIRECT_STORAGE_SIZE) {
        console.log('Updating to GridFS storage');

        const gridFSFileId = await this.storeInGridFS(updateFormDto.formData, {
          userId: existingForm.userId,
          formType: 'form-update',
        });

        updateFormDto = {
          ...updateFormDto,
          gridFSFileId: gridFSFileId.toString(),
          isLargeData: true,
          formData: undefined, // Remove direct data
          dataSize: payloadSize,
        };
      } else {
        console.log('Updating to direct storage');

        updateFormDto = {
          ...updateFormDto,
          gridFSFileId: undefined,
          isLargeData: false,
          dataSize: payloadSize,
        };
      }
    }

    const updatedForm = await this.formModel
      .findByIdAndUpdate(id, updateFormDto, { new: true })
      .populate('userId')
      .exec();

    return updatedForm;
  }

  async remove(id: string): Promise<{ message: string; success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }

    const form = await this.formModel.findById(id);
    if (!form) {
      throw new NotFoundException('Form not found');
    }

    // Clean up GridFS data if it exists
    if (form.isLargeData && form.gridFSFileId) {
      await this.deleteFromGridFS(form.gridFSFileId);
    }

    await this.formModel.findByIdAndDelete(id);

    return {
      message: 'MCERTS form deleted successfully',
      success: true,
    };
  }

  // New method for form submission
  async submitForm(formSubmissionDto: FormSubmissionDto): Promise<FormCreationResponseDto> {
    try {
      const createFormDto: CreateFormDto = {
        userId: new Types.ObjectId(formSubmissionDto.userId),
        status: formSubmissionDto.status || 'submitted',
        formData: formSubmissionDto.formData
      };

      return await this.create(createFormDto);
    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit form'
      };
    }
  }

  // Bulk update forms
  async bulkUpdateForms(bulkUpdateDto: BulkUpdateFormDto): Promise<ApiResponseDto> {
    try {
      const { formIds, status, formData } = bulkUpdateDto;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (formData) updateData.formData = formData;

      const result = await this.formModel.updateMany(
        { _id: { $in: formIds } },
        updateData
      );

      return {
        success: true,
        data: { modifiedCount: result.modifiedCount },
        message: `Successfully updated ${result.modifiedCount} forms`
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to bulk update forms'
      };
    }
  }

  // Bulk delete forms
  async bulkDeleteForms(bulkDeleteDto: BulkDeleteFormDto): Promise<ApiResponseDto> {
    try {
      const { formIds } = bulkDeleteDto;

      // Get forms to clean up GridFS data
      const forms = await this.formModel.find({ _id: { $in: formIds } });
      
      // Clean up GridFS data for large forms
      for (const form of forms) {
        if (form.isLargeData && form.gridFSFileId) {
          await this.deleteFromGridFS(form.gridFSFileId);
        }
      }

      const result = await this.formModel.deleteMany({ _id: { $in: formIds } });

      return {
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `Successfully deleted ${result.deletedCount} forms`
      };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to bulk delete forms'
      };
    }
  }

  // Get forms by query parameters
  async getFormsByQuery(queryDto: FormQueryDto): Promise<PaginatedFormsDto> {
    const { page = 1, limit = 5, sortOrder = 'desc', status, inspector, siteName, userId } = queryDto;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (inspector) query['formData.inspector'] = { $regex: inspector, $options: 'i' };
    if (siteName) query['formData.siteName'] = { $regex: siteName, $options: 'i' };

    // Get total count
    const total = await this.formModel.countDocuments(query);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get forms
    const forms = await this.formModel
      .find(query)
      .populate('userId')
      .sort({ createdAt: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // Alternative Storage Methods (Better than GridFS)
  
  // Method 1: Compressed Direct Storage (Fastest)
  private compressData(data: any): Buffer {
    const jsonData = JSON.stringify(data);
    return zlib.gzipSync(jsonData);
  }

  private decompressData(compressedData: Buffer): any {
    const decompressed = zlib.gunzipSync(compressedData);
    return JSON.parse(decompressed.toString());
  }

  // Universal data retrieval method (file storage is primary)
  private async getFormData(form: any): Promise<any> {
    // Always try file storage first (primary method)
    if (form.filePath) {
      return await this.fileStorageService.retrieveFormData(form.filePath, form.isCompressed);
    }
    
    // Fallback to other methods for backward compatibility
    switch (form.storageMethod) {
      case 'direct':
        return form.formData;
      case 'compressed':
        return this.decompressData(form.compressedData);
      case 'chunked':
        return await this.retrieveFromChunks(form.chunkedDataId);
      case 'gridfs':
        return await this.retrieveFromGridFS(form.gridFSFileId);
      case 'external':
        // Implement external storage retrieval
        return null;
      default:
        return form.formData;
    }
  }

  // Method 2: Chunked Storage for Very Large Data
  private async storeInChunks(data: any, formId: string): Promise<string> {
    const jsonData = JSON.stringify(data);
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = [];
    
    for (let i = 0; i < jsonData.length; i += chunkSize) {
      chunks.push({
        formId,
        chunkIndex: Math.floor(i / chunkSize),
        data: jsonData.slice(i, i + chunkSize),
        totalChunks: Math.ceil(jsonData.length / chunkSize)
      });
    }
    
    // Store chunks in a separate collection
    await this.connection.db.collection('formChunks').insertMany(chunks);
    return formId;
  }

  private async retrieveFromChunks(formId: string): Promise<any> {
    const chunks = await this.connection.db.collection('formChunks')
      .find({ formId })
      .sort({ chunkIndex: 1 })
      .toArray();
    
    const data = chunks.map(chunk => chunk.data).join('');
    return JSON.parse(data);
  }

  // Method 3: External File Storage (AWS S3, Azure Blob, etc.)
  private async storeInExternalStorage(data: any, metadata: any): Promise<string> {
    // This would integrate with cloud storage services
    // For now, return a placeholder
    const fileId = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real implementation, you would:
    // 1. Upload to S3/Azure Blob Storage
    // 2. Return the file URL or ID
    // 3. Store the URL in the database
    
    return fileId;
  }

  // GridFS Helper Methods (Keep as fallback)
  private async storeInGridFS(data: any, metadata: any): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      try {
      const jsonData = JSON.stringify(data);
      const readableStream = new Readable();
      readableStream.push(jsonData);
      readableStream.push(null);

      const uploadStream = this.gridFSBucket.openUploadStream(
          `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`,
          { 
            metadata: { 
              ...metadata, 
              createdAt: new Date(),
              contentType: 'application/json'
            } 
          },
      );

      uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', (error) => {
          console.error('GridFS upload error:', error);
          reject(error);
        });

      readableStream.pipe(uploadStream);
      } catch (error) {
        console.error('GridFS preparation error:', error);
        reject(error);
      }
    });
  }

  private async retrieveFromGridFS(fileId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Attempting to retrieve GridFS file: ${fileId}`);
        const objectId = new ObjectId(fileId);

        // First check if the file exists using direct chunk approach to avoid sort limit
        const fileCheck = await this.checkGridFSFileOptimized(fileId);
        if (!fileCheck.exists) {
          console.error(`GridFS file not found: ${fileId}`, fileCheck);
          reject(
            new NotFoundException(`GridFS file not found: ${fileCheck.error}`),
          );
          return;
        }

        console.log(
          `GridFS file found: ${fileId}, size: ${fileCheck.length} bytes`,
        );

        // For large files that might hit MongoDB sort memory limit, use direct chunk retrieval
        // MongoDB's default sort memory limit is 32MB, so use direct retrieval for files > 25MB
        if (fileCheck.length > 25 * 1024 * 1024) {
          // > 25MB
          console.log(
            `Using optimized chunk retrieval for large file (${(fileCheck.length / 1024 / 1024).toFixed(2)}MB)`,
          );
          const data = await this.retrieveLargeFileDirectly(
            objectId,
            fileCheck,
          );
          resolve(data);
          return;
        }

        // Use standard stream for smaller files
        const chunks: Buffer[] = [];
        const downloadStream = this.gridFSBucket.openDownloadStream(objectId);

        let totalBytesReceived = 0;

        downloadStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalBytesReceived += chunk.length;

          // Log progress for large files
          if (totalBytesReceived % (5 * 1024 * 1024) === 0) {
            // Every 5MB
            console.log(
              `Downloaded ${(totalBytesReceived / 1024 / 1024).toFixed(2)}MB of ${(fileCheck.length / 1024 / 1024).toFixed(2)}MB`,
            );
          }
        });

        downloadStream.on('end', () => {
          try {
            console.log(
              `GridFS download completed: ${totalBytesReceived} bytes received`,
            );

            if (totalBytesReceived === 0) {
              console.error('GridFS file appears to be empty');
              reject(new Error('GridFS file is empty'));
              return;
            }

            // Concatenate all chunks into a single buffer
            const fullData = Buffer.concat(chunks);
            console.log(`Concatenated buffer size: ${fullData.length} bytes`);

            // Convert to string and parse JSON
            const jsonString = fullData.toString('utf8');

            if (!jsonString.trim()) {
              console.error(
                'GridFS file contains empty or whitespace-only content',
              );
              reject(new Error('GridFS file contains no valid data'));
              return;
            }

            const parsedData = JSON.parse(jsonString);
            console.log(`Successfully parsed GridFS data for file: ${fileId}`);
            resolve(parsedData);
          } catch (parseError) {
            console.error('Failed to parse GridFS data:', {
              fileId,
              error: parseError.message,
              dataLength: totalBytesReceived,
              firstBytes:
                chunks.length > 0
                  ? chunks[0].toString(
                      'utf8',
                      0,
                      Math.min(100, chunks[0].length),
                    )
                  : 'No data',
            });
            reject(
              new Error(`Failed to parse GridFS data: ${parseError.message}`),
            );
          }
        });

        downloadStream.on('error', (error) => {
          console.error('GridFS download stream error:', {
            fileId,
            error: error.message,
            stack: error.stack,
            bytesReceived: totalBytesReceived,
          });
          reject(
            new NotFoundException(`GridFS download failed: ${error.message}`),
          );
        });
      } catch (error) {
        console.error('GridFS retrieval setup error:', {
          fileId,
          error: error.message,
          stack: error.stack,
        });
        reject(new Error(`GridFS retrieval failed: ${error.message}`));
      }
    });
  }

  private async deleteFromGridFS(fileId: string): Promise<void> {
    try {
      const objectId = new ObjectId(fileId);
      await this.gridFSBucket.delete(objectId);
      console.log(`GridFS file deleted: ${fileId}`);
    } catch (error) {
      console.error('GridFS delete error:', error);
    }
  }

  // Diagnostic Methods
  async checkGridFSFile(fileId: string): Promise<any> {
    try {
      const objectId = new ObjectId(fileId);

      // Check if file exists in GridFS
      const files = await this.gridFSBucket.find({ _id: objectId }).toArray();

      if (files.length === 0) {
        return {
          exists: false,
          error: 'File not found in GridFS',
          fileId: fileId,
        };
      }

      const file = files[0];
      return {
        exists: true,
        fileId: fileId,
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
        chunkSize: file.chunkSize,
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        fileId: fileId,
      };
    }
  }

  // Optimized file check that avoids memory limit issues
  private async checkGridFSFileOptimized(fileId: string): Promise<any> {
    try {
      const objectId = new ObjectId(fileId);

      // Direct query to fs.files collection to avoid sorting chunks
      const filesCollection = this.connection.db.collection('formData.files');
      const file = await filesCollection.findOne({ _id: objectId });

      if (!file) {
        return {
          exists: false,
          error: 'File not found in GridFS',
          fileId: fileId,
        };
      }

      return {
        exists: true,
        fileId: fileId,
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
        chunkSize: file.chunkSize,
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
        fileId: fileId,
      };
    }
  }

  // Direct chunk retrieval for very large files to bypass MongoDB sort memory limit
  private async retrieveLargeFileDirectly(
    objectId: ObjectId,
    fileInfo: any,
  ): Promise<any> {
    try {
      console.log(
        `Starting direct chunk retrieval for large file: ${objectId}`,
      );

      // Calculate total number of chunks
      const chunkSize = fileInfo.chunkSize || 261120; // Default GridFS chunk size
      const totalChunks = Math.ceil(fileInfo.length / chunkSize);
      console.log(
        `File has ${totalChunks} chunks, total size: ${(fileInfo.length / 1024 / 1024).toFixed(2)}MB`,
      );

      // Direct access to chunks collection
      const chunksCollection = this.connection.db.collection('formData.chunks');

      // Retrieve chunks in small batches to avoid memory issues
      const batchSize = 50; // Process 50 chunks at a time to be conservative
      const allChunks: Buffer[] = [];

      for (let i = 0; i < totalChunks; i += batchSize) {
        const endIndex = Math.min(i + batchSize, totalChunks);
        console.log(
          `Retrieving chunks ${i} to ${endIndex - 1} of ${totalChunks}`,
        );

        // Query chunks in smaller batches to avoid sort memory limit
        // Use individual queries for each chunk to avoid sorting large result sets
        const chunks = [];
        for (let chunkNum = i; chunkNum < endIndex; chunkNum++) {
          const chunk = await chunksCollection.findOne({
            files_id: objectId,
            n: chunkNum,
          });
          if (chunk) {
            chunks.push(chunk);
          }
        }

        // Add chunks to buffer array in correct order
        for (let j = i; j < endIndex; j++) {
          const chunk = chunks.find((c) => c.n === j);
          if (chunk) {
            allChunks[j] = chunk.data.buffer;
          } else {
            throw new Error(`Missing chunk ${j} for file ${objectId}`);
          }
        }

        // Progress logging
        if (i % (batchSize * 5) === 0) {
          const progress = ((endIndex / totalChunks) * 100).toFixed(1);
          console.log(`Chunk retrieval progress: ${progress}%`);
        }
      }

      console.log(`All ${totalChunks} chunks retrieved, concatenating...`);

      // Concatenate all chunks
      const fullData = Buffer.concat(allChunks);
      console.log(`Concatenated buffer size: ${fullData.length} bytes`);

      // Convert to string and parse JSON
      const jsonString = fullData.toString('utf8');

      if (!jsonString.trim()) {
        throw new Error('GridFS file contains no valid data');
      }

      const parsedData = JSON.parse(jsonString);
      console.log(
        `Successfully parsed large GridFS data for file: ${objectId}`,
      );

      return parsedData;
    } catch (error) {
      console.error('Direct chunk retrieval failed:', {
        fileId: objectId.toString(),
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Direct chunk retrieval failed: ${error.message}`);
    }
  }

  async diagnoseGridFSIssues(): Promise<any> {
    try {
      // Check GridFS bucket connectivity
      const stats = await this.gridFSBucket.find({}).limit(1).toArray();

      // Get all forms with GridFS data
      const formsWithGridFS = await this.formModel
        .find({
          isLargeData: true,
          gridFSFileId: { $exists: true, $ne: null },
        })
        .exec();

      const diagnostics = {
        gridFSConnected: true,
        totalFormsWithGridFS: formsWithGridFS.length,
        issues: [],
      };

      // Check each GridFS file
      for (const form of formsWithGridFS) {
        const fileCheck = await this.checkGridFSFile(form.gridFSFileId);
        if (!fileCheck.exists) {
          diagnostics.issues.push({
            formId: form._id,
            gridFSFileId: form.gridFSFileId,
            error: fileCheck.error,
            userId: form.userId,
          });
        }
      }

      return diagnostics;
    } catch (error) {
      return {
        gridFSConnected: false,
        error: error.message,
      };
    }
  }

  async verifyGridFSConnectivity(): Promise<any> {
    try {
      // Test basic GridFS operations
      const testData = { test: 'connectivity', timestamp: new Date() };

      // Try to upload a small test file
      const testFileId = await this.storeInGridFS(testData, { test: true });
      console.log(`Test file uploaded: ${testFileId}`);

      // Try to retrieve it
      const retrievedData = await this.retrieveFromGridFS(
        testFileId.toString(),
      );
      console.log('Test file retrieved successfully');

      // Clean up test file
      await this.deleteFromGridFS(testFileId.toString());
      console.log('Test file cleaned up');

      return {
        connected: true,
        message: 'GridFS connectivity verified successfully',
        testFileId: testFileId.toString(),
      };
    } catch (error) {
      console.error('GridFS connectivity test failed:', error);
      return {
        connected: false,
        error: error.message,
        message: 'GridFS connectivity test failed',
      };
    }
  }

  async recoverOrphanedGridFSData(): Promise<any> {
    try {
      const diagnostics = await this.diagnoseGridFSIssues();

      if (diagnostics.issues.length === 0) {
        return {
          success: true,
          message: 'No orphaned GridFS data found',
          recovered: 0,
        };
      }

      const recoveryResults = [];

      for (const issue of diagnostics.issues) {
        try {
          // Try to find the form and mark it as having no GridFS data
          const form = await this.formModel.findById(issue.formId);
          if (form) {
            // Clear GridFS reference and mark as non-large data
            await this.formModel.findByIdAndUpdate(issue.formId, {
              $unset: { gridFSFileId: 1 },
              $set: {
                isLargeData: false,
                formData: null, // Clear any existing form data
                dataSize: 0,
              },
            });

            recoveryResults.push({
              formId: issue.formId,
              action: 'cleared_orphaned_reference',
              success: true,
            });
          }
        } catch (error) {
          recoveryResults.push({
            formId: issue.formId,
            action: 'failed_to_recover',
            error: error.message,
            success: false,
          });
        }
      }

      return {
        success: true,
        message: `Processed ${diagnostics.issues.length} orphaned references`,
        recovered: recoveryResults.filter((r) => r.success).length,
        failed: recoveryResults.filter((r) => !r.success).length,
        details: recoveryResults,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to recover orphaned GridFS data',
      };
    }
  }

  // Emergency recovery method for specific file with memory limit issues
  async emergencyRecoverFile(fileId: string): Promise<any> {
    try {
      console.log(`Emergency recovery for file: ${fileId}`);
      const objectId = new ObjectId(fileId);

      // Try optimized file check first
      const fileCheck = await this.checkGridFSFileOptimized(fileId);
      if (!fileCheck.exists) {
        return {
          success: false,
          error: 'File not found in GridFS',
          action: 'file_not_found',
        };
      }

      console.log(
        `File exists, attempting direct chunk recovery. Size: ${(fileCheck.length / 1024 / 1024).toFixed(2)}MB`,
      );

      // Try direct chunk retrieval
      try {
        const data = await this.retrieveLargeFileDirectly(objectId, fileCheck);
        return {
          success: true,
          message: 'File recovered successfully using direct chunk retrieval',
          dataSize: fileCheck.length,
          action: 'recovered',
        };
      } catch (directError) {
        console.error('Direct chunk retrieval failed:', directError.message);

        // If direct retrieval fails, mark the form as having corrupted data
        const forms = await this.formModel
          .find({ gridFSFileId: fileId })
          .exec();
        const recoveryResults = [];

        for (const form of forms) {
          try {
            await this.formModel.findByIdAndUpdate(form._id, {
              $unset: { gridFSFileId: 1 },
              $set: {
                isLargeData: false,
                formData: {
                  _corrupted: true,
                  _originalSize: fileCheck.length,
                  _error: 'Memory limit exceeded during retrieval',
                },
                dataSize: 0,
              },
            });

            recoveryResults.push({
              formId: form._id,
              action: 'marked_as_corrupted',
              success: true,
            });
          } catch (updateError) {
            recoveryResults.push({
              formId: form._id,
              action: 'failed_to_update',
              error: updateError.message,
              success: false,
            });
          }
        }

        return {
          success: true,
          message: 'File marked as corrupted due to memory limit issues',
          action: 'marked_corrupted',
          affectedForms: recoveryResults.length,
          details: recoveryResults,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        action: 'recovery_failed',
      };
    }
  }

  // Force optimized retrieval for testing
  async forceOptimizedRetrieval(fileId: string): Promise<any> {
    try {
      console.log(`Force optimized retrieval for file: ${fileId}`);
      const objectId = new ObjectId(fileId);

      const fileCheck = await this.checkGridFSFileOptimized(fileId);
      if (!fileCheck.exists) {
        throw new NotFoundException('File not found in GridFS');
      }

      console.log(
        `Forcing direct chunk retrieval for file: ${fileId}, size: ${(fileCheck.length / 1024 / 1024).toFixed(2)}MB`,
      );
      const data = await this.retrieveLargeFileDirectly(objectId, fileCheck);

      return {
        success: true,
        message: 'File retrieved successfully using optimized method',
        fileId: fileId,
        dataSize: fileCheck.length,
        data: data,
      };
    } catch (error) {
      console.error('Force optimized retrieval failed:', error);
      throw error;
    }
  }

  // Simple and fast API for inspection list data
  async getInspectionList(query: InspectionListQueryDto): Promise<InspectionListResponseDto> {
    const startTime = Date.now();
    const { page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc', status, inspector, siteName } = query;

    // Build query filters - only fetch essential fields for performance
    const queryFilter: any = {};

    if (status) {
      queryFilter.status = status;
    }

    if (inspector) {
      queryFilter['formData.inspector'] = { $regex: inspector, $options: 'i' };
    }

    if (siteName) {
      queryFilter['formData.siteName'] = { $regex: siteName, $options: 'i' };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const total = await this.formModel.countDocuments(queryFilter);

    // Execute optimized query - only fetch essential fields
    const forms = await this.formModel
      .find(queryFilter)
      .select('_id status formData.siteName formData.inspector formData.dateOfInspection createdAt')
      .populate('userId', 'name email') // Only populate essential user fields
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Transform data to match the table structure
    const inspectionList: InspectionListItemDto[] = forms.map((form) => {
      const siteName = form.formData?.siteName || 'Unnamed Site';
      const siteInitial = siteName.charAt(0).toUpperCase();
      
      // Handle createdAt date safely
      let createdDate = 'Not specified';
      if (form.createdAt) {
        try {
          createdDate = new Date(form.createdAt).toLocaleDateString('en-GB'); // DD/MM/YYYY format
        } catch (error) {
          console.warn('Error formatting created date:', error);
          createdDate = 'Not specified';
        }
      }
      
      return {
        id: form._id.toString(),
        siteName: siteName,
        siteId: form._id.toString(),
        inspector: form.formData?.inspector || 'Not specified',
        status: form.status || 'Draft',
        dateOfInspection: form.formData?.dateOfInspection || 'Not specified',
        createdDate: createdDate,
        siteInitial: siteInitial,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response: InspectionListResponseDto = {
      data: inspectionList,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
      summary: {
        showing: `Showing ${skip + 1} to ${Math.min(skip + limit, total)} of ${total} results`,
        totalResults: total,
      },
    };

    // Log performance metrics
    const processingTime = Date.now() - startTime;
    console.log(`Inspection list API - Processed ${forms.length} forms in ${processingTime}ms`);

    return response;
  }
}
