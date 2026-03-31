import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// W3C Trace Context — https://www.w3.org/TR/trace-context/
function generateTraceId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSpanId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const traceInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (!isApiRequest) {
    return next(req);
  }

  const traceId = generateTraceId();
  const spanId = generateSpanId();
  // version=00, traceId (32 hex chars), parentId (16 hex chars), flags=01 (sampled)
  const traceparent = `00-${traceId}-${spanId}-01`;

  const tracedReq = req.clone({
    setHeaders: { traceparent },
  });

  return next(tracedReq);
};
