import { Types } from 'mongoose';

export class CreateFormDto {
  userId: Types.ObjectId; // This will be populated with complete user data
  status?: string;
  formData?: Record<string, any>;
} 