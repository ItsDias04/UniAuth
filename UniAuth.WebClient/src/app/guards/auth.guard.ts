import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../pages/service/auth.service';

/**
 * Functional route guard — проверяет аутентификацию.
 * Перенаправляет на /auth/login если пользователь не аутентифицирован.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};

/**
 * Functional route guard — только для гостей.
 * Перенаправляет на / если пользователь уже аутентифицирован.
 */
export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/']);
    return false;
};
