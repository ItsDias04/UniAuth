import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';

export const securityOfficerGuard: CanActivateFn = () => {
    const authSessionService = inject(AuthSessionService);
    const router = inject(Router);

    const token = authSessionService.getSecurityOfficerToken();
    if (token) {
        return true;
    }

    return router.createUrlTree(['/security-monitor/login']);
};
