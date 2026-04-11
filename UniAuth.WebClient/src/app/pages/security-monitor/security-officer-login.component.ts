import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';
import { SecurityMonitoringService } from '@/@core/contexts/security/security-monitoring.service';

@Component({
    selector: 'app-security-officer-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule, PasswordModule, MessageModule],
    templateUrl: './security-officer-login.component.html',
    styleUrl: './security-officer-login.component.scss'
})
export class SecurityOfficerLoginComponent {
    login = '';
    password = '';
    loading = false;
    errorMessage = '';
    infoMessage = 'Вход только для безопасника (изолированный аккаунт SOC).';

    constructor(
        private readonly securityMonitoringService: SecurityMonitoringService,
        private readonly authSessionService: AuthSessionService,
        private readonly router: Router
    ) {}

    onLogin(): void {
        if (!this.login.trim() || !this.password.trim()) {
            this.errorMessage = 'Укажите логин и пароль безопасника';
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        this.securityMonitoringService
            .loginOfficer({
                login: this.login.trim(),
                password: this.password
            })
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.authSessionService.setSecurityOfficerToken(response.accessToken);
                    this.infoMessage = 'Авторизация успешна. Открываем Security Monitoring Console.';
                    void this.router.navigateByUrl('/security-monitor/dashboard');
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.loading = false;
                    this.errorMessage = this.extractErrorMessage(error);
                }
            });
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Не удалось выполнить вход безопасника';
    }
}
