// Common pagination
export interface PaginationRequest {
  page?: number;
  page_size?: number;
}

export interface PaginationResponse {
  total?: number;
  page?: number;
  page_size?: number;
}

// Time range filter
export interface TimeRange {
  start_time?: number;
  end_time?: number;
}
