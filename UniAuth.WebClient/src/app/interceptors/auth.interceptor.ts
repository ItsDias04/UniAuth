import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authSessionService = inject(AuthSessionService);
    const isSecurityMonitoringRequest = req.url.includes('/security-monitoring');
    const accessToken = isSecurityMonitoringRequest ? authSessionService.getSecurityOfficerToken() : authSessionService.getAccessToken();

    if (!accessToken) {
        return next(req);
    }

    return next(
        req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        })
    );
};
