import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    tap({
      error: (error) => {
        // Auto-logout on 401 (stale token, user deleted, etc.)
        if (error.status === 401 && authService.isAuthenticated()) {
          authService.logout();
        }
      },
    })
  );
};
