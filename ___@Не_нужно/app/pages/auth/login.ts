import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, MessageModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">UniAuth — Вход</div>
                            <span class="text-muted-color font-medium">Войдите для продолжения</span>
                        </div>

                        @if (errorMessage) {
                            <p-message severity="error" [text]="errorMessage" styleClass="mb-4 w-full" />
                        }

                        @if (successMessage) {
                            <p-message severity="success" [text]="successMessage" styleClass="mb-4 w-full" />
                        }

                        <div>
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Адрес электронной почты" class="w-full md:w-120 mb-8" [(ngModel)]="email" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Пароль</label>
                            <p-password id="password1" [(ngModel)]="password" placeholder="Пароль" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox [(ngModel)]="rememberMe" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">Запомнить меня</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Забыли пароль?</span>
                            </div>
                            <p-button label="Войти" styleClass="w-full" [loading]="loading" (onClick)="onLogin()"></p-button>

                            <div class="text-center mt-6">
                                <span class="text-muted-color">Нет аккаунта? </span>
                                <a routerLink="/auth/register" class="text-primary font-medium cursor-pointer">Зарегистрироваться</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login {
    email: string = '';
    password: string = '';
    rememberMe: boolean = false;
    loading: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    onLogin(): void {
        this.errorMessage = '';
        this.loading = true;

        this.authService.login({
            email: this.email,
            password: this.password,
        }).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.mfaRequired) {
                    this.router.navigate(['/auth/mfa-verify']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.error?.message || 'Ошибка входа. Проверьте учётные данные.';
            },
        });
    }
}
