import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../pages/service/auth.service';

/**
 * HTTP Interceptor — добавляет JWT access token к запросам
 * и обрабатывает 401 ответы (обновление токена).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401 && token && !req.url.includes('/auth/login') && !req.url.includes('/token/refresh')) {
                return authService.refreshToken().pipe(
                    switchMap((response) => {
                        const newReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${response.accessToken}`,
                            },
                        });
                        return next(newReq);
                    }),
                    catchError((refreshError) => {
                        authService.logout();
                        return throwError(() => refreshError);
                    }),
                );
            }
            return throwError(() => error);
        }),
    );
};
