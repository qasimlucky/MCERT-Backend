import { IsString, IsMongoId, IsOptional, IsObject } from 'class-validator';
import { Types } from 'mongoose';

export class CreateFormDto {
  @IsMongoId()
  userId: Types.ObjectId; // This will be populated with complete user data
  
  @IsString()
  @IsOptional()
  status?: string;
  
  @IsObject()
  @IsOptional()
  formData?: Record<string, any>;
} 