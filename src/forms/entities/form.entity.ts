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

  // Flowmeter Information
  @Prop()
  flowmeterMakeModel?: string;

  @Prop()
  flowmeterType?: string;

  @Prop()
  flowmeterSerial?: string;

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

  // Inspection of flow monitoring system 4.0
  @Prop()
  inspectionFlowDescription?: string;

  @Prop({ type: [FileUpload] })
  inspectionFlowImages?: FileUpload[];

  // Flow measurement verification check 5.0
  @Prop()
  flowMeasurementDescription?: string;

  @Prop({ type: [FileUpload] })
  flowMeasurementImages?: FileUpload[];

  // Survey measurement equipment 6.0
  @Prop()
  surveyEquipmentDescription?: string;

  @Prop({ type: [FileUpload] })
  surveyEquipmentImages?: FileUpload[];

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

  @Prop({ type: [FileUpload] })
  appendixBFiles?: FileUpload[];

  @Prop({ type: [FileUpload] })
  appendixCFiles?: FileUpload[];

  // Signature fields
  @Prop()
  signatureIncluded?: boolean;

  @Prop()
  signatureName?: string;

  @Prop()
  signatureCompany?: string;
}

@Schema({ timestamps: true })
export class Form extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'pending', required: true })
  status: string;

  // MCERTS Form Data - stored directly for small data, GridFS for large data
  @Prop({ type: McertsFormData })
  formData?: McertsFormData;

  // For large form data (>= 15MB) - stored in GridFS
  @Prop({ type: String, default: null })
  gridFSFileId?: string;

  // Indicates whether data is stored in GridFS or directly
  @Prop({ default: false })
  isLargeData: boolean;

  // Size of the form data in bytes
  @Prop({ default: 0 })
  dataSize: number;
}

export const FormSchema = SchemaFactory.createForClass(Form);
