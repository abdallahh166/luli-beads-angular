// src/app/core/interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError, from } from 'rxjs';
import { TokenStorageService } from '../services/token-storage.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  // Skip authentication for public routes
  if (isPublicRoute(req.url)) {
    return next(req);
  }

  return from(tokenStorage.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(authReq);
      }
      return next(req);
    }),
    catchError(error => {
      // Handle 401 errors by signing out the user
      if (error.status === 401) {
        authService.signOut();
      }
      return throwError(() => error);
    })
  );
};

function isPublicRoute(url: string): boolean {
  const publicRoutes = [
    '/auth',
    '/public',
    '/api/public',
    '/reset-password'
  ];
  
  return publicRoutes.some(route => url.includes(route));
}
