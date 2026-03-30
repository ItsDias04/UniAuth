import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AppFloatingConfigurator } from '@/@core/layout/component/app.floatingconfigurator';
import { SecurityAuthService } from '@/@core/contexts/security/security-auth.service';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, MessageModule, AppFloatingConfigurator],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    step: 1 | 2 | 3 = 1;
    email = '';
    password = '';
    mfaCode = '';
    rememberMe = false;
    loading = false;
    mfaToken: string | null = null;
    infoMessage = '';
    errorMessage = '';
    returnUrl: string | null = null;

    constructor(
        private readonly securityAuthService: SecurityAuthService,
        private readonly authSessionService: AuthSessionService,
        private readonly route: ActivatedRoute,
        private readonly router: Router
    ) {}

    ngOnInit(): void {
        const requestedReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.returnUrl = this.normalizeReturnUrl(requestedReturnUrl);
    }

    get hasReturnUrl(): boolean {
        return !!this.returnUrl;
    }

    get registrationQueryParams(): { returnUrl: string } | null {
        if (!this.returnUrl) {
            return null;
        }

        return { returnUrl: this.returnUrl };
    }

    onLogin(): void {
        this.errorMessage = '';
        this.infoMessage = '';
        this.loading = true;

        this.securityAuthService
            .initiate({
                email: this.email,
                password: this.password
            })
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.infoMessage = response.message;

                    if (response.mfaRequired) {
                        this.step = 2;
                        this.mfaToken = response.mfaToken ?? null;
                        return;
                    }

                    if (response.accessToken && response.refreshToken) {
                        this.authSessionService.setTokens(response.accessToken, response.refreshToken);
                        this.step = 3;
                        if (this.hasReturnUrl) {
                            this.infoMessage = 'Вход выполнен. Перенаправляем к подтверждению редиректа...';
                            this.continueAfterLogin();
                        }
                    }
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.loading = false;
                    this.errorMessage = this.extractErrorMessage(error);
                }
            });
    }

    onVerifyMfa(): void {
        if (!this.mfaToken) {
            this.errorMessage = 'MFA токен не найден. Повторите вход.';
            return;
        }

        this.errorMessage = '';
        this.infoMessage = '';
        this.loading = true;

        this.securityAuthService
            .verifyMfa({
                mfaToken: this.mfaToken,
                code: this.mfaCode
            })
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.authSessionService.setTokens(response.accessToken, response.refreshToken);
                    this.infoMessage = response.message;
                    this.step = 3;

                    if (this.hasReturnUrl) {
                        this.infoMessage = 'MFA подтвержден. Перенаправляем к подтверждению редиректа...';
                        this.continueAfterLogin();
                    }
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.loading = false;
                    this.errorMessage = this.extractErrorMessage(error);
                }
            });
    }

    continueAfterLogin(): void {
        if (!this.returnUrl) {
            return;
        }

        void this.router.navigateByUrl(this.returnUrl);
    }

    resetLoginFlow(): void {
        this.step = 1;
        this.mfaCode = '';
        this.mfaToken = null;
        this.errorMessage = '';
        this.infoMessage = '';
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }

        return message ?? 'Ошибка входа. Проверьте учетные данные и попробуйте снова.';
    }

    private normalizeReturnUrl(value: string | null): string | null {
        if (!value) {
            return null;
        }

        // Allow internal app routes only.
        if (value.startsWith('/')) {
            return value;
        }

        return null;
    }
}
