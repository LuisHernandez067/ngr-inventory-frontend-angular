import { HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';

function createInjector(routerOverride?: Partial<Router>) {
  const mockRouter: Partial<Router> = {
    navigate: jest.fn().mockResolvedValue(true),
    ...routerOverride,
  };

  return Injector.create({
    providers: [
      { provide: Router, useValue: mockRouter },
    ],
  });
}

function runInterceptor(
  injector: Injector,
  responseOrError: HttpResponse<unknown> | HttpErrorResponse
): { error: unknown; router: Partial<Router> } {
  const router = injector.get(Router) as unknown as Partial<Router>;
  let capturedError: unknown = null;

  const mockNext: HttpHandlerFn = (_req) => {
    if (responseOrError instanceof HttpErrorResponse) {
      return throwError(() => responseOrError);
    }
    return of(responseOrError);
  };

  const req = new HttpRequest('GET', '/api/v1/test');

  runInInjectionContext(injector, () => {
    errorInterceptor(req, mockNext).subscribe({
      error: (err: unknown) => { capturedError = err; },
    });
  });

  return { error: capturedError, router };
}

describe('errorInterceptor', () => {
  it('should redirect to /auth/login on 401 Unauthorized', () => {
    const injector = createInjector();
    const error401 = new HttpErrorResponse({ status: 401, url: '/api/v1/me' });

    const { router } = runInterceptor(injector, error401);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { reason: 'session-expired' } }
    );
  });

  it('should NOT redirect on 403 Forbidden', () => {
    const injector = createInjector();
    const error403 = new HttpErrorResponse({ status: 403, url: '/api/v1/admin' });

    const { router } = runInterceptor(injector, error403);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should emit AppError with type FORBIDDEN for 403', () => {
    const injector = createInjector();
    const error403 = new HttpErrorResponse({ status: 403, url: '/api/v1/admin' });

    const { error } = runInterceptor(injector, error403);

    expect(error).not.toBeNull();
    expect((error as { type: string }).type).toBe('FORBIDDEN');
  });

  it('should emit AppError with type UNAUTHORIZED for 401', () => {
    const injector = createInjector();
    const error401 = new HttpErrorResponse({ status: 401, url: '/api/v1/me' });

    const { error } = runInterceptor(injector, error401);

    expect(error).not.toBeNull();
    expect((error as { type: string }).type).toBe('UNAUTHORIZED');
  });

  it('should pass through non-HTTP errors without redirecting', () => {
    const injector = createInjector();
    const router = injector.get(Router) as unknown as Partial<Router>;
    let capturedError: unknown = null;

    const networkError = new TypeError('Failed to fetch');
    const mockNext: HttpHandlerFn = (_req) => throwError(() => networkError);
    const req = new HttpRequest('GET', '/api/v1/test');

    runInInjectionContext(injector, () => {
      errorInterceptor(req, mockNext).subscribe({
        error: (err: unknown) => { capturedError = err; },
      });
    });

    expect(router.navigate).not.toHaveBeenCalled();
    expect(capturedError).toBe(networkError);
  });

  it('should pass through successful response unchanged', () => {
    const injector = createInjector();
    const successResponse = new HttpResponse({ status: 200, body: { ok: true } });
    let receivedResponse: unknown = null;

    const mockNext: HttpHandlerFn = (_req) => of(successResponse);
    const req = new HttpRequest('GET', '/api/v1/test');

    runInInjectionContext(injector, () => {
      errorInterceptor(req, mockNext).subscribe({
        next: (res) => { receivedResponse = res; },
      });
    });

    expect(receivedResponse).toBe(successResponse);
    const router = injector.get(Router) as unknown as Partial<Router>;
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
