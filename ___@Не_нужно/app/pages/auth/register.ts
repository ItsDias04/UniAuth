import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../service/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ButtonModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, MessageModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">UniAuth — Регистрация</div>
                            <span class="text-muted-color font-medium">Создайте учётную запись</span>
                        </div>

                        @if (errorMessage) {
                            <p-message severity="error" [text]="errorMessage" styleClass="mb-4 w-full" />
                        }

                        @if (successMessage) {
                            <p-message severity="success" [text]="successMessage" styleClass="mb-4 w-full" />
                        }

                        <div>
                            <label for="displayName" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Имя</label>
                            <input pInputText id="displayName" type="text" placeholder="Ваше имя" class="w-full md:w-120 mb-8" [(ngModel)]="displayName" />

                            <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email" type="email" placeholder="Адрес электронной почты" class="w-full md:w-120 mb-8" [(ngModel)]="email" />

                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Пароль</label>
                            <p-password id="password" [(ngModel)]="password" placeholder="Пароль (мин. 8 символов)" [toggleMask]="true" styleClass="mb-4" [fluid]="true"></p-password>

                            <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2 mt-4">Подтвердите пароль</label>
                            <p-password id="confirmPassword" [(ngModel)]="confirmPassword" placeholder="Повторите пароль" [toggleMask]="true" styleClass="mb-8" [fluid]="true" [feedback]="false"></p-password>

                            <p-button label="Зарегистрироваться" styleClass="w-full" [loading]="loading" (onClick)="onRegister()"></p-button>

                            <div class="text-center mt-6">
                                <span class="text-muted-color">Уже есть аккаунт? </span>
                                <a routerLink="/auth/login" class="text-primary font-medium cursor-pointer">Войти</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Register {
    displayName: string = '';
    email: string = '';
    password: string = '';
    confirmPassword: string = '';
    loading: boolean = false;
    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    onRegister(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (this.password !== this.confirmPassword) {
            this.errorMessage = 'Пароли не совпадают';
            return;
        }

        if (this.password.length < 8) {
            this.errorMessage = 'Пароль должен содержать минимум 8 символов';
            return;
        }

        this.loading = true;

        this.authService.register({
            email: this.email,
            password: this.password,
            displayName: this.displayName,
        }).subscribe({
            next: () => {
                this.loading = false;
                this.successMessage = 'Регистрация успешна! Перенаправление на вход...';
                setTimeout(() => this.router.navigate(['/auth/login']), 2000);
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.error?.message || 'Ошибка регистрации. Попробуйте другой email.';
            },
        });
    }
}
