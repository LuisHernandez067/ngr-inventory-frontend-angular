import { HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

// environment.apiUrl = 'http://localhost:3000/api/v1' (dev)
// We mock the environment to control the apiUrl
jest.mock('../../../environments/environment', () => ({
  environment: { apiUrl: 'http://localhost:3000/api/v1' },
}));

function runInterceptor(url: string): {
  capturedReq: HttpRequest<unknown> | null;
  withCredentials: boolean | null;
} {
  let capturedReq: HttpRequest<unknown> | null = null;

  const mockNext: HttpHandlerFn = (req) => {
    capturedReq = req;
    return of(new HttpResponse({ status: 200 }));
  };

  const req = new HttpRequest('GET', url);
  authInterceptor(req, mockNext).subscribe();

  return {
    capturedReq,
    withCredentials: capturedReq ? (capturedReq as HttpRequest<unknown>).withCredentials : null,
  };
}

describe('authInterceptor', () => {
  it('should add withCredentials: true for API requests', () => {
    const { withCredentials } = runInterceptor('http://localhost:3000/api/v1/products');
    expect(withCredentials).toBe(true);
  });

  it('should NOT add withCredentials for non-API requests', () => {
    const { withCredentials } = runInterceptor('https://fonts.googleapis.com/css2');
    expect(withCredentials).toBe(false);
  });

  it('should pass through non-API request unchanged', () => {
    const externalUrl = 'https://cdn.example.com/asset.js';
    const { capturedReq } = runInterceptor(externalUrl);
    expect(capturedReq).not.toBeNull();
    expect((capturedReq as HttpRequest<unknown>).url).toBe(externalUrl);
    expect((capturedReq as HttpRequest<unknown>).withCredentials).toBe(false);
  });

  it('should preserve the original request URL when adding credentials', () => {
    const apiUrl = 'http://localhost:3000/api/v1/inventory/movements?page=1';
    const { capturedReq } = runInterceptor(apiUrl);
    expect(capturedReq).not.toBeNull();
    expect((capturedReq as HttpRequest<unknown>).url).toBe(apiUrl);
  });

  it('should call next exactly once', () => {
    const mockNext = jest.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    const req = new HttpRequest('POST', 'http://localhost:3000/api/v1/login', {});
    authInterceptor(req, mockNext as unknown as HttpHandlerFn).subscribe();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
