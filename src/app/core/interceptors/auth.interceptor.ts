import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Las cookies HttpOnly se envían automáticamente con withCredentials: true
  // Este interceptor asegura que solo los requests a nuestra API lleven credenciales
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (isApiRequest) {
    const authReq = req.clone({ withCredentials: true });
    return next(authReq);
  }

  return next(req);
};
