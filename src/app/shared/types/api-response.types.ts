export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// RFC 9457 Problem Details
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: FieldError[];
  [key: string]: unknown;
}

export interface FieldError {
  field: string;
  message: string;
  code?: string;
}
