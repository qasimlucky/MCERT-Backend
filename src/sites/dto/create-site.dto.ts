import { IsString, IsNotEmpty, IsDate, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  siteName: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsDate()
  @Type(() => Date)
  installationDate: Date;

  @IsObject()
  @IsOptional()
  extraData?: Record<string, any>;
} 