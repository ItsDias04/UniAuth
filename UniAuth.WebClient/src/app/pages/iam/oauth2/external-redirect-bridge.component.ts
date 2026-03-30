import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';
import { Oauth2SsoService } from '@/@core/contexts/oauth2/oauth2-sso.service';
import { SecurityAuthService } from '@/@core/contexts/security/security-auth.service';

@Component({
    selector: 'app-external-redirect-bridge',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, MessageModule],
    templateUrl: './external-redirect-bridge.component.html',
    styleUrl: './external-redirect-bridge.component.scss'
})
export class ExternalRedirectBridgeComponent implements OnInit {
    loading = false;
    checkingCurrent = false;
    errorMessage = '';
    infoMessage = '';
    isAuthenticated = false;

    token1 = '';
    token3 = '';
    redirectUrl = '';
    expiresInSeconds = 0;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly authSessionService: AuthSessionService,
        private readonly oauth2SsoService: Oauth2SsoService,
        private readonly securityAuthService: SecurityAuthService
    ) {}

    ngOnInit(): void {
        this.token1 = (this.route.snapshot.paramMap.get('token1') ?? this.route.snapshot.queryParamMap.get('token1') ?? this.route.snapshot.queryParamMap.get('externalToken') ?? '').trim();

        if (!this.token1) {
            this.errorMessage = 'Token 1 отсутствует в URL. Используйте ссылку формата /oauth2/external-redirect/{token1}.';
            return;
        }

        this.checkCurrentSession();
    }

    confirmRedirect(): void {
        this.errorMessage = '';
        this.infoMessage = '';

        if (!this.token1) {
            this.errorMessage = 'Token 1 отсутствует в URL.';
            return;
        }

        if (!this.isAuthenticated) {
            this.infoMessage = 'Сессия не активна. Перенаправляем на страницу входа...';
            this.redirectToLogin();
            return;
        }

        this.loading = true;
        this.oauth2SsoService.verifyToken1(this.token1).subscribe({
            next: (response) => {
                this.loading = false;
                this.token3 = response.token3;

                this.redirectUrl = response.redirectUrl;
                this.expiresInSeconds = response.expiresInSeconds;
                this.infoMessage = 'Успешно. Выполняем редирект во внешний сервис...';
                window.location.href = response.redirectUrl;
            },
            error: (error: HttpErrorResponse) => {
                this.loading = false;

                if (error.status === 401) {
                    this.authSessionService.clear();
                    this.isAuthenticated = false;
                    this.infoMessage = 'Сессия истекла. Перенаправляем на страницу входа...';
                    this.redirectToLogin();
                    return;
                }

                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    logoutAndLogin(): void {
        this.authSessionService.clear();
        this.isAuthenticated = false;
        this.redirectToLogin();
    }

    private checkCurrentSession(): void {
        this.errorMessage = '';
        this.infoMessage = 'Проверяем текущую сессию...';
        this.checkingCurrent = true;

        this.securityAuthService.current().subscribe({
            next: () => {
                this.checkingCurrent = false;
                this.isAuthenticated = true;
                this.infoMessage = 'Сессия активна. Подтвердите редирект во внешний сервис.';
            },
            error: (error: HttpErrorResponse) => {
                this.checkingCurrent = false;
                this.authSessionService.clear();
                this.isAuthenticated = false;

                if (error.status === 401) {
                    this.infoMessage = 'Сессия не активна. Перенаправляем на страницу входа...';
                    this.redirectToLogin();
                    return;
                }

                this.errorMessage = this.extractErrorMessage(error);
                this.infoMessage = '';
            }
        });
    }

    private redirectToLogin(): void {
        void this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: this.router.url }
        });
    }

    private extractErrorMessage(error: unknown): string {
        const err = error as { error?: { message?: string | string[] } };
        const message = err?.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Не удалось выполнить redirect flow.';
    }
}
