import { ProblemDetail } from './api-response.types';

export type AppErrorType =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface AppError {
  type: AppErrorType;
  title: string;
  detail?: string;
  status?: number;
  code?: string;
  fieldErrors?: import('./api-response.types').FieldError[];
  originalProblem?: ProblemDetail;
}
