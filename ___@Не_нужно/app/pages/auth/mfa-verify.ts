import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-mfa-verify',
    standalone: true,
    imports: [ButtonModule, InputTextModule, FormsModule, RouterModule, RippleModule, MessageModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="flex justify-center items-center border-2 border-primary rounded-full mx-auto mb-6" style="width: 3.2rem; height: 3.2rem">
                                <i class="text-primary pi pi-fw pi-shield text-2xl!"></i>
                            </div>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Двухфакторная аутентификация</div>
                            <span class="text-muted-color font-medium">Введите код из приложения-аутентификатора</span>
                        </div>

                        @if (errorMessage) {
                            <p-message severity="error" [text]="errorMessage" styleClass="mb-4 w-full" />
                        }

                        <div>
                            <label for="code" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Код подтверждения</label>
                            <input pInputText id="code" type="text" placeholder="000000" class="w-full md:w-120 mb-8 text-center text-2xl tracking-widest" [(ngModel)]="code" maxlength="6" />

                            <p-button label="Подтвердить" styleClass="w-full" [loading]="loading" (onClick)="onVerify()"></p-button>

                            <div class="text-center mt-6">
                                <a routerLink="/auth/login" class="text-primary font-medium cursor-pointer">
                                    <i class="pi pi-arrow-left mr-2"></i>Вернуться к входу
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class MfaVerify {
    code: string = '';
    loading: boolean = false;
    errorMessage: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    onVerify(): void {
        this.errorMessage = '';

        if (this.code.length !== 6) {
            this.errorMessage = 'Код должен содержать 6 цифр';
            return;
        }

        const challengeId = this.authService.mfaChallengeId();
        if (!challengeId) {
            this.errorMessage = 'Сессия MFA истекла. Повторите вход.';
            return;
        }

        this.loading = true;

        this.authService.verifyMfa({
            challengeId,
            code: this.code,
        }).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.error?.message || 'Неверный код. Попробуйте снова.';
            },
        });
    }
}
