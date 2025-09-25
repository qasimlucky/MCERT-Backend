import { 
  IsString, 
  IsMongoId, 
  IsOptional, 
  IsObject, 
  IsArray, 
  IsBoolean, 
  IsDateString, 
  ValidateNested, 
  IsNumber, 
  IsNotEmpty,
  IsIn
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

// ============================================================================
// FILE UPLOAD DTO
// ============================================================================
export class FileUploadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  data: string; // Base64 encoded file data
}

// ============================================================================
// MCERTS FORM DATA DTO (Detailed structure for formData)
// ============================================================================
export class McertsFormDataDto {
  // Report Preparation Details
  @IsString()
  @IsOptional()
  reportPreparedBy?: string;

  @IsString()
  @IsNotEmpty()
  inspector: string;

  // Consent/Permit Holder & Company Registration
  @IsString()
  @IsNotEmpty()
  consentPermitHolder: string;

  @IsString()
  @IsOptional()
  consentPermitNo?: string;

  // Site Information
  @IsString()
  @IsNotEmpty()
  siteName: string;

  @IsString()
  @IsOptional()
  siteContact?: string;

  @IsString()
  @IsOptional()
  siteAddress?: string;

  @IsString()
  @IsOptional()
  siteRefPostcode?: string;

  @IsString()
  @IsOptional()
  irishGridRef?: string;

  @IsOptional()
  aerialViewFile?: FileUploadDto;

  // References & Definitions section
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  references?: string[];

  // Aerial view & general arrangement section
  @IsString()
  @IsOptional()
  aerialViewDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  aerialViewImages?: FileUploadDto[];

  // Flowmeter Information
  @IsString()
  @IsOptional()
  flowmeterMakeModel?: string;

  @IsString()
  @IsNotEmpty()
  flowmeterType: string;

  @IsString()
  @IsOptional()
  flowmeterSerial?: string;

  @IsString()
  @IsOptional()
  niwAssetId?: string;

  // Compliance and Inspection Details
  @IsString()
  @IsOptional()
  statementOfCompliance?: string;

  @IsString()
  @IsOptional()
  uncertainty?: string;

  @IsString()
  @IsOptional()
  inspectionReportNo?: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfInspection: string;

  @IsString()
  @IsOptional()
  siteDescription?: string;

  @IsString()
  @IsOptional()
  flowmeterLocation?: string;

  // Permit Limits
  @IsString()
  @IsOptional()
  wocNumber?: string;

  @IsString()
  @IsOptional()
  dryW?: string;

  @IsString()
  @IsOptional()
  maxD?: string;

  @IsString()
  @IsOptional()
  maxFFT?: string;

  @IsString()
  @IsOptional()
  qmaxF?: string;

  // Additional Information
  @IsString()
  @IsOptional()
  field1?: string;

  @IsString()
  @IsOptional()
  field2?: string;

  @IsString()
  @IsOptional()
  field3?: string;

  // Site process & schematic diagram 3.0
  @IsString()
  @IsOptional()
  siteProcessDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  siteProcessImages?: FileUploadDto[];

  // Inspection of flow monitoring system 4.0
  @IsString()
  @IsOptional()
  inspectionFlowDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  inspectionFlowImages?: FileUploadDto[];

  // Flow measurement verification check 5.0
  @IsString()
  @IsOptional()
  flowMeasurementDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  flowMeasurementImages?: FileUploadDto[];

  // Survey measurement equipment 6.0
  @IsString()
  @IsOptional()
  surveyEquipmentDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  surveyEquipmentImages?: FileUploadDto[];

  // Conclusion section
  @IsString()
  @IsOptional()
  conclusionUnCert?: string;

  @IsString()
  @IsOptional()
  conclusionDate?: string;

  // Appendix fields
  @IsString()
  @IsOptional()
  appendixField1?: string;

  @IsString()
  @IsOptional()
  appendixField2?: string;

  @IsString()
  @IsOptional()
  appendixField3?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  appendixAFiles?: FileUploadDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  appendixBFiles?: FileUploadDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileUploadDto)
  @IsOptional()
  appendixCFiles?: FileUploadDto[];

  // Signature fields
  @IsBoolean()
  @IsOptional()
  signatureIncluded?: boolean;

  @IsString()
  @IsOptional()
  signatureName?: string;

  @IsString()
  @IsOptional()
  signatureCompany?: string;
}

// ============================================================================
// MAIN FORM DTOs (Matching your current structure)
// ============================================================================

// Create Form DTO
export class CreateFormDto {
  @IsMongoId()
  userId: Types.ObjectId; // This will be populated with complete user data

  @IsString()
  @IsOptional()
  status?: string;

  @ValidateNested()
  @Type(() => McertsFormDataDto)
  @IsOptional()
  formData?: McertsFormDataDto;
}

// Update Form DTO
export class UpdateFormDto {
  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  status?: string;

  @ValidateNested()
  @Type(() => McertsFormDataDto)
  @IsOptional()
  formData?: McertsFormDataDto;

  @IsString()
  @IsOptional()
  gridFSFileId?: string;

  @IsBoolean()
  @IsOptional()
  isLargeData?: boolean;

  @IsNumber()
  @IsOptional()
  dataSize?: number;
}

// Form Submission DTO (for the complete payload)
export class FormSubmissionDto {
  @ValidateNested()
  @Type(() => McertsFormDataDto)
  formData: McertsFormDataDto;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

// Form Response DTO
export class FormResponseDto {
  @IsMongoId()
  _id: Types.ObjectId;

  @IsMongoId()
  userId: Types.ObjectId;

  @ValidateNested()
  @Type(() => McertsFormDataDto)
  @IsOptional()
  formData?: McertsFormDataDto;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  gridFSFileId?: string;

  @IsBoolean()
  @IsOptional()
  isLargeData?: boolean;

  @IsNumber()
  @IsOptional()
  dataSize?: number;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

// ============================================================================
// PAGINATION DTOs
// ============================================================================

// Pagination Metadata DTO
export class PaginationDto {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  total: number;

  @IsNumber()
  totalPages: number;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  includeFormData?: boolean;
}

// Paginated Forms Response DTO
export class PaginatedFormsDto {
  @IsArray()
  data: any[];

  @ValidateNested()
  @Type(() => PaginationDto)
  pagination: PaginationDto;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

// Form Query Parameters DTO
export class FormQueryDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  limit?: number = 5;

  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  inspector?: string;

  @IsString()
  @IsOptional()
  siteName?: string;

  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId;
}

// ============================================================================
// VALIDATION DTOs
// ============================================================================

// Validation Error DTO
export class ValidationErrorDto {
  @IsString()
  field: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  value?: string;
}

// Validation Response DTO
export class ValidationResponseDto {
  @IsBoolean()
  isValid: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationErrorDto)
  errors: ValidationErrorDto[];
}

// ============================================================================
// API RESPONSE DTOs
// ============================================================================

// Generic API Response DTO
export class ApiResponseDto<T = any> {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  data?: T;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  error?: string;
}

// Form Creation Response DTO
export class FormCreationResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  data?: any;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  error?: string;
}

// ============================================================================
// BULK OPERATIONS DTOs
// ============================================================================

// Bulk Update DTO
export class BulkUpdateFormDto {
  @IsArray()
  @IsMongoId({ each: true })
  formIds: Types.ObjectId[];

  @IsString()
  @IsOptional()
  status?: string;

  @ValidateNested()
  @Type(() => McertsFormDataDto)
  @IsOptional()
  formData?: Partial<McertsFormDataDto>;
}

// Bulk Delete DTO
export class BulkDeleteFormDto {
  @IsArray()
  @IsMongoId({ each: true })
  formIds: Types.ObjectId[];
}

// All DTOs are already exported above with their class declarations
