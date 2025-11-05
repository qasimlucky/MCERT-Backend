import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import * as zlib from 'zlib';
import { SecondFileStorageService } from './second-file-storage.service';
import { SecondForm } from './entities/second-form.entity';
import { 
  CreateSecondFormDto, 
  UpdateSecondFormDto, 
  SecondFormSubmissionDto,
  SecondFormResponseDto,
  PaginationDto,
  PaginatedSecondFormsDto,
  SecondFormQueryDto,
  ApiResponseDto,
  SecondFormCreationResponseDto,
  BulkUpdateSecondFormDto,
  BulkDeleteSecondFormDto
} from './dto/second-forms.dto';
import { 
  InspectionListQueryDto, 
  InspectionListResponseDto,
  InspectionListItemDto 
} from './dto/inspection-list.dto';

@Injectable()
export class SecondFormsService {
  private gridFSBucket: GridFSBucket;
  private readonly MAX_DIRECT_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB - increased limit with compression

  constructor(
    @InjectModel(SecondForm.name) private readonly secondFormModel: Model<SecondForm>,
    @InjectConnection() private connection: Connection,
    private readonly secondFileStorageService: SecondFileStorageService,
  ) {
    // Initialize GridFS bucket with optimized settings for large files
    this.gridFSBucket = new GridFSBucket(this.connection.db as any, {
      bucketName: 'secondFormData',
      chunkSizeBytes: 2 * 1024 * 1024, // 2MB chunks to reduce chunk count
    });
  }

  async create(createSecondFormDto: CreateSecondFormDto): Promise<SecondFormCreationResponseDto> {
    try {
      // Validate required fields
      if (!createSecondFormDto.userId) {
        throw new Error('userId is required');
      }

      // Convert userId to ObjectId if it's a string
      const userId = typeof createSecondFormDto.userId === 'string' 
        ? new Types.ObjectId(createSecondFormDto.userId) 
        : createSecondFormDto.userId;

      // Optimize payload size calculation - only serialize if needed
      let payloadSize = 0;
      let formData = createSecondFormDto.formData;
      
      if (formData) {
        // Quick size estimation without full JSON.stringify
        const dataString = JSON.stringify(formData);
        payloadSize = dataString.length;
        
        // Log only if size is significant
        if (payloadSize > 1024 * 1024) { // Only log if > 1MB
          console.log(`Second form payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      let secondFormDocument: any = {
        userId: userId,
        status: createSecondFormDto.status || 'pending',
        dataSize: payloadSize,
        storageMethod: 'file',
      };

      // Store ALL form data as files on server (fastest and most consistent approach)
      const formId = `second-form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileResult = await this.secondFileStorageService.storeFormData(formId, formData, {
        compress: payloadSize > 1 * 1024 * 1024, // Compress if > 1MB for better performance
        format: 'json'
      });

      secondFormDocument.filePath = fileResult.filePath;
      secondFormDocument.fileName = fileResult.filePath.split(/[/\\]/).pop();
      secondFormDocument.isCompressed = fileResult.compressed;
      secondFormDocument.fileSize = fileResult.fileSize;
      secondFormDocument.storageMethod = 'file';
      
      console.log(`Second form data stored as file: ${secondFormDocument.fileName} (${(fileResult.fileSize / 1024 / 1024).toFixed(2)}MB, compressed: ${fileResult.compressed})`);

      // Save form without populate to avoid extra query
      const savedForm = await this.secondFormModel.create(secondFormDocument);

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
        message: 'Second MCERTS form created successfully'
      };
    } catch (error) {
      console.error('Error creating Second MCERTS form:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create Second MCERTS form'
      };
    }
  }

  async findAll(): Promise<any[]> {
    const forms = await this.secondFormModel.find().populate('userId').exec();

    // Process each form to include data from files
    for (const form of forms) {
      try {
        form.formData = await this.getFormData(form);
      } catch (error) {
        console.error(`Error retrieving second form data for ${form._id}:`, error);
        form.formData = null;
      }
    }

    return forms;
  }

  // Get form with data (including file data)
  async findOneWithData(id: string): Promise<any> {
    const form = await this.secondFormModel.findById(id).populate('userId').exec();
    
    if (!form) {
      throw new NotFoundException(`Second Form with ID ${id} not found`);
    }

    // Retrieve form data from file (primary method)
    try {
      form.formData = await this.getFormData(form);
    } catch (error) {
      console.error(`Error retrieving second form data for ${form._id}:`, error);
      throw new Error(`Failed to retrieve second form data: ${error.message}`);
    }

    return form;
  }

  async findAllPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedSecondFormsDto> {
    const startTime = Date.now();
    const { page, limit, sortBy, sortOrder, search, status } = paginationDto;
    const includeFormData = true;
    // Build query filters
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { status: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Get total count for pagination info
    const total = await this.secondFormModel.countDocuments(query);

    // Execute paginated query
    const formsQuery = this.secondFormModel
      .find(query)
      .populate('userId')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const forms = await formsQuery.exec();
    console.log(
      `Retrieved ${forms.length} second forms for pagination. includeFormData: ${includeFormData}`,
    );

    // Process forms - using parallel processing
    const processedForms = await Promise.all(
      forms.map(async (form) => {
        if (includeFormData) {
          try {
            form.formData = await this.getFormData(form);
            return form.toObject();
          } catch (error) {
            console.error(`Failed to retrieve data for second form ${form._id}:`, error);
            return {
              ...form.toObject(),
              formData: null,
              _error: 'Failed to retrieve second form data from storage',
            };
          }
        }
        return form.toObject();
      }),
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

    const totalTime = Date.now() - startTime;
    console.log(`⏱️  Total processing time for second forms: ${totalTime}ms`);

    return response;
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid second form ID');
    }

    const form = await this.secondFormModel.findById(id).populate('userId').exec();
    if (!form) {
      throw new NotFoundException('Second Form not found');
    }

    // Retrieve form data from file
    try {
      form.formData = await this.getFormData(form);
    } catch (error) {
      console.error('Failed to retrieve second form data:', error);
      return {
        ...form.toObject(),
        formData: null,
        _error: 'Failed to retrieve second form data from storage',
      };
    }

    return form;
  }

  async findByUserId(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }

    const forms = await this.secondFormModel
      .find({ userId: userId })
      .populate('userId')
      .exec();

    return forms.map((form) => {
      return form.toObject();
    });
  }

  async findByUserIdPaginated(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedSecondFormsDto> {
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
    const total = await this.secondFormModel.countDocuments(query);

    // Execute paginated query
    const forms = await this.secondFormModel
      .find(query)
      .populate('userId')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Process forms based on includeFormData flag
    const processedForms = await Promise.all(
      forms.map(async (form) => {
        if (includeFormData) {
          try {
            form.formData = await this.getFormData(form);
            return form.toObject();
          } catch (error) {
            console.error(
              `Failed to retrieve data for second form ${form._id}:`,
              error,
            );
            return {
              ...form.toObject(),
              formData: null,
              _error: 'Failed to retrieve second form data from storage',
            };
          }
        }
        return form.toObject();
      }),
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

    return response;
  }

  async update(id: string, updateSecondFormDto: UpdateSecondFormDto): Promise<SecondForm> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid second form ID');
    }

    const existingForm = await this.secondFormModel.findById(id);
    if (!existingForm) {
      throw new NotFoundException('Second Form not found');
    }

    // If updating form data, handle file storage
    if (updateSecondFormDto.formData) {
      const payloadSize = JSON.stringify(updateSecondFormDto.formData).length;
      console.log(
        `Update second form payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`,
      );

      // Delete old file if exists
      if (existingForm.filePath) {
        try {
          await this.secondFileStorageService.deleteFormData(existingForm.filePath);
        } catch (error) {
          console.error('Error deleting old second form file:', error);
        }
      }

      // Store new data as file
      const formId = existingForm._id.toString();
      const fileResult = await this.secondFileStorageService.storeFormData(formId, updateSecondFormDto.formData, {
        compress: payloadSize > 1 * 1024 * 1024,
        format: 'json'
      });

      updateSecondFormDto = {
        ...updateSecondFormDto,
        filePath: fileResult.filePath,
        fileName: fileResult.filePath.split(/[/\\]/).pop(),
        isCompressed: fileResult.compressed,
        fileSize: fileResult.fileSize,
        storageMethod: 'file',
        dataSize: payloadSize,
      };
    }

    const updatedForm = await this.secondFormModel
      .findByIdAndUpdate(id, updateSecondFormDto, { new: true })
      .populate('userId')
      .exec();

    return updatedForm;
  }

  async remove(id: string): Promise<{ message: string; success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid second form ID');
    }

    const form = await this.secondFormModel.findById(id);
    if (!form) {
      throw new NotFoundException('Second Form not found');
    }

    // Clean up file storage if it exists
    if (form.filePath) {
      try {
        await this.secondFileStorageService.deleteFormData(form.filePath);
      } catch (error) {
        console.error('Error deleting second form file:', error);
      }
    }

    await this.secondFormModel.findByIdAndDelete(id);

    return {
      message: 'Second MCERTS form deleted successfully',
      success: true,
    };
  }

  // New method for form submission
  async submitForm(formSubmissionDto: SecondFormSubmissionDto): Promise<SecondFormCreationResponseDto> {
    try {
      const createSecondFormDto: CreateSecondFormDto = {
        userId: new Types.ObjectId(formSubmissionDto.userId),
        status: formSubmissionDto.status || 'submitted',
        formData: formSubmissionDto.formData
      };

      return await this.create(createSecondFormDto);
    } catch (error) {
      console.error('Error submitting second form:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit second form'
      };
    }
  }

  // Bulk update forms
  async bulkUpdateForms(bulkUpdateDto: BulkUpdateSecondFormDto): Promise<ApiResponseDto> {
    try {
      const { formIds, status, formData } = bulkUpdateDto;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (formData) updateData.formData = formData;

      const result = await this.secondFormModel.updateMany(
        { _id: { $in: formIds } },
        updateData
      );

      return {
        success: true,
        data: { modifiedCount: result.modifiedCount },
        message: `Successfully updated ${result.modifiedCount} second forms`
      };
    } catch (error) {
      console.error('Error in bulk update second forms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to bulk update second forms'
      };
    }
  }

  // Bulk delete forms
  async bulkDeleteForms(bulkDeleteDto: BulkDeleteSecondFormDto): Promise<ApiResponseDto> {
    try {
      const { formIds } = bulkDeleteDto;

      // Get forms to clean up file storage
      const forms = await this.secondFormModel.find({ _id: { $in: formIds } });
      
      // Clean up files
      for (const form of forms) {
        if (form.filePath) {
          try {
            await this.secondFileStorageService.deleteFormData(form.filePath);
          } catch (error) {
            console.error('Error deleting second form file:', error);
          }
        }
      }

      const result = await this.secondFormModel.deleteMany({ _id: { $in: formIds } });

      return {
        success: true,
        data: { deletedCount: result.deletedCount },
        message: `Successfully deleted ${result.deletedCount} second forms`
      };
    } catch (error) {
      console.error('Error in bulk delete second forms:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to bulk delete second forms'
      };
    }
  }

  // Get forms by query parameters
  async getFormsByQuery(queryDto: SecondFormQueryDto): Promise<PaginatedSecondFormsDto> {
    const { page = 1, limit = 5, sortOrder = 'desc', status, inspector, siteName, userId } = queryDto;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (inspector) query['formData.inspector'] = { $regex: inspector, $options: 'i' };
    if (siteName) query['formData.siteName'] = { $regex: siteName, $options: 'i' };

    // Get total count
    const total = await this.secondFormModel.countDocuments(query);

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Get forms
    const forms = await this.secondFormModel
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

  // Universal data retrieval method (file storage is primary)
  private async getFormData(form: any): Promise<any> {
    // Always try file storage first (primary method)
    if (form.filePath) {
      return await this.secondFileStorageService.retrieveFormData(form.filePath, form.isCompressed);
    }
    
    // Fallback to other methods for backward compatibility
    switch (form.storageMethod) {
      case 'direct':
        return form.formData;
      case 'compressed':
        return this.decompressData(form.compressedData);
      default:
        return form.formData;
    }
  }

  private decompressData(compressedData: Buffer): any {
    const decompressed = zlib.gunzipSync(compressedData);
    return JSON.parse(decompressed.toString());
  }

  // Migration method to convert existing forms to file storage
  async migrateToFileStorage(): Promise<{
    totalForms: number;
    migratedForms: number;
    failedForms: number;
    errors: string[];
  }> {
    console.log('Starting migration of second forms to file storage...');
    
    const errors: string[] = [];
    let migratedForms = 0;
    let failedForms = 0;

    try {
      // Find all forms that are not already using file storage
      const formsToMigrate = await this.secondFormModel.find({
        $or: [
          { storageMethod: { $ne: 'file' } },
          { filePath: { $exists: false } },
          { filePath: null }
        ]
      }).exec();

      console.log(`Found ${formsToMigrate.length} second forms to migrate`);

      for (const form of formsToMigrate) {
        try {
          await this.migrateSingleForm(form);
          migratedForms++;
          
          if (migratedForms % 10 === 0) {
            console.log(`Migrated ${migratedForms}/${formsToMigrate.length} second forms...`);
          }
        } catch (error) {
          failedForms++;
          const errorMsg = `Failed to migrate second form ${form._id}: ${error.message}`;
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
      default:
        formData = form.formData;
    }

    if (!formData) {
      throw new Error('No second form data found to migrate');
    }

    // Store form data as file
    const formId = form._id.toString();
    const fileResult = await this.secondFileStorageService.storeFormData(formId, formData, {
      compress: JSON.stringify(formData).length > 1024 * 1024, // Compress if > 1MB
      format: 'json'
    });

    // Update form document
    await this.secondFormModel.updateOne(
      { _id: form._id },
      {
        $set: {
          filePath: fileResult.filePath,
          fileName: fileResult.filePath.split(/[/\\]/).pop(),
          isCompressed: fileResult.compressed,
          fileSize: fileResult.fileSize,
          storageMethod: 'file'
        },
        $unset: {
          formData: 1,
          compressedData: 1,
          gridFSFileId: 1,
          chunkedDataId: 1
        }
      }
    );

    console.log(`Migrated second form ${form._id} to file: ${fileResult.filePath}`);
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
    const total = await this.secondFormModel.countDocuments(queryFilter);

    // Execute optimized query - only fetch essential fields
    const forms = await this.secondFormModel
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
    console.log(`Second forms inspection list API - Processed ${forms.length} forms in ${processingTime}ms`);

    return response;
  }
}

