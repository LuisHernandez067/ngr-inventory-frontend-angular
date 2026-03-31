import { HttpErrorResponse } from '@angular/common/http';
import { AppError, AppErrorType, ProblemDetail } from '../types';

export class ErrorAdapter {
  static fromHttpError(httpError: HttpErrorResponse): AppError {
    const problem = httpError.error as ProblemDetail | null;

    const type = ErrorAdapter.resolveType(httpError.status);
    const title = problem?.title ?? ErrorAdapter.defaultTitle(httpError.status);
    const detail = problem?.detail;
    const code = problem?.code;
    const fieldErrors = problem?.errors;

    return {
      type,
      title,
      detail,
      status: httpError.status,
      code,
      fieldErrors,
      originalProblem: problem ?? undefined,
    };
  }

  private static resolveType(status: number): AppErrorType {
    switch (status) {
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION';
      default:
        if (status >= 500) return 'SERVER_ERROR';
        if (status === 0) return 'NETWORK_ERROR';
        return 'UNKNOWN';
    }
  }

  private static defaultTitle(status: number): string {
    const titles: Record<number, string> = {
      400: 'Solicitud inválida',
      401: 'Sesión no válida o expirada',
      403: 'No tenés permiso para realizar esta acción',
      404: 'El recurso solicitado no existe',
      409: 'Conflicto con el estado actual del recurso',
      422: 'Los datos enviados no son válidos',
      500: 'Error interno del servidor',
      502: 'Servicio no disponible temporalmente',
      503: 'Servicio no disponible temporalmente',
    };
    return titles[status] ?? 'Ocurrió un error inesperado';
  }
}
