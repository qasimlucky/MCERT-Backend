// Validation decorators removed - no validation needed
import { Type, Transform } from 'class-transformer';
import { Types } from 'mongoose';

// ============================================================================
// FILE UPLOAD DTO
// ============================================================================
export class FileUploadDto {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded file data
}

// ============================================================================
// MCERTS FORM DATA DTO (Detailed structure for formData)
// ============================================================================
export class McertsFormDataDto {
  // Report Preparation Details
  reportPreparedBy?: string;
  inspector?: string;

  // Consent/Permit Holder & Company Registration
  consentPermitHolder?: string;
  consentPermitNo?: string;

  // Site Information
  siteName?: string;
  siteContact?: string;
  siteAddress?: string;
  siteRefPostcode?: string;
  irishGridRef?: string;
  aerialViewFile?: FileUploadDto;

  // References & Definitions section
  references?: string[];

  // Aerial view & general arrangement section
  aerialViewDescription?: string;
  aerialViewImages?: FileUploadDto[];

  // Flowmeter Information
  flowmeterMakeModel?: string;
  flowmeterType?: string;
  flowmeterSerial?: string;
  niwAssetId?: string;

  // Compliance and Inspection Details
  statementOfCompliance?: string;
  uncertainty?: string;
  inspectionReportNo?: string;
  dateOfInspection?: string;
  siteDescription?: string;
  flowmeterLocation?: string;

  // Permit Limits
  wocNumber?: string;
  dryW?: string;
  maxD?: string;
  maxFFT?: string;
  qmaxF?: string;

  // Additional Information
  field1?: string;
  field2?: string;
  field3?: string;

  // Site process & schematic diagram 3.0
  siteProcessDescription?: string;
  siteProcessImages?: FileUploadDto[];

  // Inspection of flow monitoring system 4.0
  inspectionFlowDescription?: string;
  inspectionFlowImages?: FileUploadDto[];

  // Flow measurement verification check 5.0
  flowMeasurementDescription?: string;
  flowMeasurementImages?: FileUploadDto[];

  // Survey measurement equipment 6.0
  surveyEquipmentDescription?: string;
  surveyEquipmentImages?: FileUploadDto[];

  // Conclusion section
  conclusionUnCert?: string;
  conclusionDate?: string;

  // Appendix fields
  appendixField1?: string;
  appendixField2?: string;
  appendixField3?: string;
  appendixAFiles?: FileUploadDto[];
  appendixBFiles?: FileUploadDto[];
  appendixCFiles?: FileUploadDto[];

  // Signature fields
  signatureIncluded?: boolean;
  signatureName?: string;
  signatureCompany?: string;
}

// ============================================================================
// MAIN FORM DTOs (Matching your current structure)
// ============================================================================

// Create Form DTO
export class CreateFormDto {
  userId: Types.ObjectId; // This will be populated with complete user data
  status?: string;
  formData?: McertsFormDataDto;
}

// Update Form DTO
export class UpdateFormDto {
  userId?: Types.ObjectId;
  status?: string;
  formData?: McertsFormDataDto;
  gridFSFileId?: string;
  isLargeData?: boolean;
  dataSize?: number;
}

// Form Submission DTO (for the complete payload)
export class FormSubmissionDto {
  formData: McertsFormDataDto;
  status?: string;
  userId?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

// Form Response DTO
export class FormResponseDto {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  formData?: McertsFormDataDto;
  status: string;
  gridFSFileId?: string;
  isLargeData?: boolean;
  dataSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// PAGINATION DTOs
// ============================================================================

// Pagination Metadata DTO
export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  status?: string;
  includeFormData?: boolean;
}

// Paginated Forms Response DTO
export class PaginatedFormsDto {
  data: any[];
  pagination: PaginationDto;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

// Form Query Parameters DTO
export class FormQueryDto {
  page?: number = 1;
  limit?: number = 5;
  sortOrder?: 'asc' | 'desc' = 'desc';
  status?: string;
  inspector?: string;
  siteName?: string;
  userId?: Types.ObjectId;
}

// ============================================================================
// VALIDATION DTOs
// ============================================================================

// Validation Error DTO
export class ValidationErrorDto {
  field: string;
  message: string;
  value?: string;
}

// Validation Response DTO
export class ValidationResponseDto {
  isValid: boolean;
  errors: ValidationErrorDto[];
}

// ============================================================================
// API RESPONSE DTOs
// ============================================================================

// Generic API Response DTO
export class ApiResponseDto<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Creation Response DTO
export class FormCreationResponseDto {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

// ============================================================================
// BULK OPERATIONS DTOs
// ============================================================================

// Bulk Update DTO
export class BulkUpdateFormDto {
  formIds: Types.ObjectId[];
  status?: string;
  formData?: Partial<McertsFormDataDto>;
}

// Bulk Delete DTO
export class BulkDeleteFormDto {
  formIds: Types.ObjectId[];
}

// All DTOs are already exported above with their class declarations
