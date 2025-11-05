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

