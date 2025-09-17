import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateFormDto } from './create-form.dto';

export class UpdateFormDto extends PartialType(CreateFormDto) {
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