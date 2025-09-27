// Validation decorators removed - no validation needed

export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'asc' | 'desc' = 'desc';
  search?: string;
  status?: string;
  includeFormData?: boolean = false;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    search?: string;
    status?: string;
    sortBy: string;
    sortOrder: string;
  };
}
