import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class InspectionListQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 5;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  inspector?: string;

  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class InspectionListItemDto {
  id: string;
  siteName: string;
  siteId: string;
  inspector: string;
  status: string;
  dateOfInspection: string;
  createdDate: string;
  siteInitial: string;
}

export class InspectionListResponseDto {
  data: InspectionListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    showing: string;
    totalResults: number;
  };
}
