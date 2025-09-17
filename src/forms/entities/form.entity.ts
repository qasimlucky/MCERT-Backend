import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Form extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: 'pending', required: true })
  status: string;

  // For small form data (< 15MB) - stored directly
  @Prop({ type: Object, default: null })
  formData?: {
    [key: string]: any; // Allow additional fields in formData
  };

  // For large form data (>= 15MB) - stored in GridFS
  @Prop({ type: String, default: null })
  gridFSFileId?: string;

  // Indicates whether data is stored in GridFS or directly
  @Prop({ default: false })
  isLargeData: boolean;

  // Size of the form data in bytes
  @Prop({ default: 0 })
  dataSize: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FormSchema = SchemaFactory.createForClass(Form); 