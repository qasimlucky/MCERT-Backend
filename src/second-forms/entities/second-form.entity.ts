import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// File Upload Schema
@Schema({ _id: false })
export class FileUpload {
  @Prop()
  name?: string;

  @Prop()
  type?: string;

  @Prop()
  size?: number;

  @Prop()
  data?: string; // Base64 encoded file data
}

// MCERTS Form Data Schema
@Schema({ _id: false })
export class McertsFormData {
  // Report Preparation Details
  @Prop()
  reportPreparedBy?: string;

  @Prop()
  inspector?: string;

  // Consent/Permit Holder & Company Registration
  @Prop()
  consentPermitHolder?: string;

  @Prop()
  consentPermitNo?: string;

  // Site Information
  @Prop()
  siteName?: string;

  @Prop()
  siteContact?: string;

  @Prop()
  siteAddress?: string;

  @Prop()
  siteRefPostcode?: string;

  @Prop()
  irishGridRef?: string;

  @Prop({ type: FileUpload })
  aerialViewFile?: FileUpload;

  // References & Definitions section
  @Prop({ type: [String] })
  references?: string[];

  // Aerial view & general arrangement section
  @Prop()
  aerialViewDescription?: string;

  @Prop({ type: [FileUpload] })
  aerialViewImages?: FileUpload[];

  @Prop({ type: [String] })
  aerialViewCaptions?: string[];

  // Flowmeter Information
  @Prop()
  flowmeterMakeModel?: string;

  @Prop()
  flowmeterType?: string;

  @Prop()
  flowmeterSerial?: string;

  @Prop()
  secondaryDeviceType?: string;

  @Prop()
  flowmeterTransmitterSerial?: string;

  @Prop()
  flowmeterSensorSerial?: string;

  @Prop()
  niwAssetId?: string;

  // Compliance and Inspection Details
  @Prop()
  statementOfCompliance?: string;

  @Prop()
  uncertainty?: string;

  @Prop()
  inspectionReportNo?: string;

  @Prop()
  dateOfInspection?: string;

  @Prop()
  siteDescription?: string;

  @Prop()
  flowmeterLocation?: string;

  // MCERTS Certification
  @Prop()
  mcertProductCertified?: string;

  @Prop()
  mcertCertificateNo?: string;

  @Prop()
  mcertCertificationDate?: string;

  // Primary Device Information
  @Prop()
  primaryDeviceType?: string;

  @Prop()
  primaryDeviceDescription?: string;

  @Prop()
  primaryDeviceCompliance?: string;

  @Prop({ type: [FileUpload] })
  primaryDeviceImages?: FileUpload[];

  @Prop({ type: [String] })
  primaryDeviceCaptions?: string[];

  // Secondary Device Information
  @Prop()
  secondaryDeviceTransmitter?: string;

  @Prop()
  secondaryDeviceSensor?: string;

  @Prop()
  secondaryDeviceCompliance?: string;

  @Prop({ type: [FileUpload] })
  secondaryDeviceImages?: FileUpload[];

  @Prop({ type: [String] })
  secondaryDeviceCaptions?: string[];

  @Prop()
  secondaryDeviceDescription?: string;

  // Verification Details
  @Prop()
  verificationDescription?: string;

  @Prop()
  verificationCalibrationReference?: string;

  @Prop()
  verificationPlateMeasurement?: string;

  @Prop()
  verificationInstrumentDisplay?: string;

  @Prop()
  verificationHeadError?: string;

  @Prop()
  verificationRepeatabilityError?: string;

  @Prop()
  verificationCurvePointCheck?: string;

  @Prop({ type: [FileUpload] })
  verificationImages?: FileUpload[];

  @Prop({ type: [String] })
  verificationCaptions?: string[];

  // Telemetry Information
  @Prop()
  telemetryCheck?: string;

  @Prop()
  telemetryUncertainty?: string;

  // NIEA Viewpoint
  @Prop()
  nieaViewpointDescription?: string;

  @Prop()
  nieaInstantaneousFlow?: string;

  @Prop()
  nieaPeriodTotal?: string;

  @Prop()
  nieaSecondaryDisplay?: string;

  @Prop()
  nieaMcertSticker?: string;

  @Prop({ type: [FileUpload] })
  nieaImages?: FileUpload[];

  @Prop({ type: [String] })
  nieaCaptions?: string[];

  @Prop()
  nieaDescription?: string;

  // Routine Maintenance
  @Prop()
  routineMaintenanceDescription?: string;

  @Prop({ type: [FileUpload] })
  routineMaintenanceImages?: FileUpload[];

  @Prop({ type: [String] })
  routineMaintenanceCaptions?: string[];

  // Routine Verification
  @Prop()
  routineVerificationDescription?: string;

  @Prop({ type: [FileUpload] })
  routineVerificationImages?: FileUpload[];

  @Prop({ type: [String] })
  routineVerificationCaptions?: string[];

  // Additional Dates and Information
  @Prop()
  nextFlowValidationDate?: string;

  @Prop({ type: [FileUpload] })
  criticalDataStickerImages?: FileUpload[];

  @Prop({ type: [String] })
  criticalDataStickerCaptions?: string[];

  @Prop({ type: [Object] })
  surveyEquipmentTable?: any[];

  // Conclusion Uncertainty Sheets
  @Prop()
  conclusionUncertaintySheetF2?: string;

  @Prop()
  conclusionUncertaintySheetF104?: string;

  // Permit Limits
  @Prop()
  wocNumber?: string;

  @Prop()
  dryW?: string;

  @Prop()
  maxD?: string;

  @Prop()
  maxFFT?: string;

  @Prop()
  qmaxF?: string;

  // Additional Information
  @Prop()
  field1?: string;

  @Prop()
  field2?: string;

  @Prop()
  field3?: string;

  // Site process & schematic diagram 3.0
  @Prop()
  siteProcessDescription?: string;

  @Prop({ type: [FileUpload] })
  siteProcessImages?: FileUpload[];

  @Prop({ type: [String] })
  siteProcessCaptions?: string[];

  // Inspection of flow monitoring system 4.0
  @Prop()
  inspectionFlowDescription?: string;

  @Prop({ type: [FileUpload] })
  inspectionFlowImages?: FileUpload[];

  @Prop({ type: [String] })
  inspectionFlowCaptions?: string[];

  // Flow measurement verification check 5.0
  @Prop()
  flowMeasurementDescription?: string;

  @Prop({ type: [FileUpload] })
  flowMeasurementImages?: FileUpload[];

  @Prop({ type: [String] })
  flowMeasurementCaptions?: string[];

  // Survey measurement equipment 6.0
  @Prop()
  surveyEquipmentDescription?: string;

  @Prop({ type: [FileUpload] })
  surveyEquipmentImages?: FileUpload[];

  @Prop({ type: [String] })
  surveyEquipmentCaptions?: string[];

  // Conclusion section
  @Prop()
  conclusionUnCert?: string;

  @Prop()
  conclusionDate?: string;

  // Appendix fields
  @Prop()
  appendixField1?: string;

  @Prop()
  appendixField2?: string;

  @Prop()
  appendixField3?: string;

  @Prop({ type: [FileUpload] })
  appendixAFiles?: FileUpload[];

  @Prop({ type: [String] })
  appendixACaptions?: string[];

  @Prop({ type: [FileUpload] })
  appendixBFiles?: FileUpload[];

  @Prop({ type: [String] })
  appendixBCaptions?: string[];

  @Prop({ type: [FileUpload] })
  appendixCFiles?: FileUpload[];

  @Prop({ type: [String] })
  appendixCCaptions?: string[];

  // Signature fields
  @Prop()
  signatureIncluded?: boolean;

  @Prop()
  signatureName?: string;

  @Prop()
  signatureCompany?: string;
}

@Schema({ timestamps: true })
export class SecondForm extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'pending', required: true })
  status: string;

  // MCERTS Form Data - ALL data stored as files on server for maximum performance
  @Prop({ type: McertsFormData })
  formData?: McertsFormData; // Only used for backward compatibility

  // File storage for ALL form data (primary storage method)
  @Prop({ type: String, required: true })
  filePath: string;

  // File storage metadata
  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ default: false })
  isCompressed?: boolean;

  @Prop({ default: 0 })
  fileSize?: number;

  // Legacy storage methods (for backward compatibility)
  @Prop({ type: Buffer })
  compressedData?: Buffer;

  @Prop({ type: String, default: null })
  gridFSFileId?: string;

  @Prop({ type: String, default: null })
  chunkedDataId?: string;

  // Storage method indicator (file is primary method for all forms)
  @Prop({ 
    type: String, 
    enum: ['file', 'direct', 'compressed', 'chunked', 'gridfs', 'external'],
    default: 'file' 
  })
  storageMethod: string;

  // Size of the form data in bytes
  @Prop({ default: 0 })
  dataSize: number;

  // Timestamp fields (added by timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const SecondFormSchema = SchemaFactory.createForClass(SecondForm);

// Add database indexes for better query performance
SecondFormSchema.index({ userId: 1 });
SecondFormSchema.index({ status: 1 });
SecondFormSchema.index({ createdAt: -1 });
SecondFormSchema.index({ userId: 1, status: 1 });
SecondFormSchema.index({ dataSize: 1 });

