import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import {
    InitiateRegistrationRequest,
    RegistrationService,
} from '@/@core/contexts/iam/registration.service';
import { AppFloatingConfigurator } from '@/@core/layout/component/app.floatingconfigurator';

@Component({
    selector: 'app-registration',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, InputTextModule, PasswordModule, ButtonModule, MessageModule, AppFloatingConfigurator],
    templateUrl: './registration.component.html',
    styleUrl: './registration.component.scss'
})
export class RegistrationComponent implements OnDestroy {
    private readonly formBuilder = inject(FormBuilder);

    currentStep = 1;
    isLoading = false;
    isCompleted = false;

    registrationId: string | null = null;
    tempToken: string | null = null;

    remainingSeconds = 0;
    private timerSubscription: Subscription | null = null;

    errorMessage: string | null = null;
    infoMessage: string | null = null;

    readonly initiateForm = this.formBuilder.nonNullable.group({
        login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(64)]],
        password: [
          '',  [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]
        ],
        confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
        firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
        lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
        phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{7,14}$/)]],
        email: ['', [Validators.required, Validators.email]]
    });

    readonly emailForm = this.formBuilder.nonNullable.group({
        emailCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    readonly whatsappForm = this.formBuilder.nonNullable.group({
        whatsAppCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    constructor(private readonly registrationService: RegistrationService) {}

    get formattedTime(): string {
        const minutes = Math.floor(this.remainingSeconds / 60)
            .toString()
            .padStart(2, '0');
        const seconds = Math.floor(this.remainingSeconds % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    get timerExpired(): boolean {
        return this.remainingSeconds <= 0 && this.currentStep > 1 && !this.isCompleted;
    }

    submitInitiate(): void {
        if (this.initiateForm.controls.password.getRawValue() !== this.initiateForm.controls.confirmPassword.getRawValue()) {
            this.errorMessage = 'Пароли не совпадают.';
            return;
        }
        if (this.initiateForm.invalid) {
            this.initiateForm.markAllAsTouched();
            return;
        }

        this.errorMessage = null;
        this.infoMessage = null;
        this.isLoading = true;

        const payload: InitiateRegistrationRequest = this.initiateForm.getRawValue();

        this.registrationService.initiate(payload).subscribe({
            next: (response) => {
                this.registrationId = response.registrationId;
                this.currentStep = 2;
                this.startTimer(response.expiresInSeconds);
                this.infoMessage = response.message;
                this.isLoading = false;
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.errorMessage = this.extractErrorMessage(error);
                this.isLoading = false;
            }
        });
    }

    submitEmailVerification(): void {
        if (this.emailForm.invalid) {
            this.emailForm.markAllAsTouched();
            return;
        }

        if (!this.registrationId || this.timerExpired) {
            this.errorMessage = 'Время подтверждения истекло. Начните регистрацию заново.';
            return;
        }

        this.errorMessage = null;
        this.infoMessage = null;
        this.isLoading = true;

        this.registrationService
            .verifyEmail({
                registrationId: this.registrationId,
                emailCode: this.emailForm.controls.emailCode.getRawValue()
            })
            .subscribe({
                next: (response) => {
                    this.tempToken = response.tempToken;
                    this.currentStep = 3;
                    this.infoMessage = response.message;
                    this.isLoading = false;
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.errorMessage = this.extractErrorMessage(error);
                    this.isLoading = false;
                }
            });
    }

    submitWhatsAppVerification(): void {
        if (this.whatsappForm.invalid) {
            this.whatsappForm.markAllAsTouched();
            return;
        }

        if (!this.registrationId || !this.tempToken || this.timerExpired) {
            this.errorMessage = 'Время подтверждения истекло. Начните регистрацию заново.';
            return;
        }

        this.errorMessage = null;
        this.infoMessage = null;
        this.isLoading = true;

        this.registrationService
            .verifyWhatsApp({
                registrationId: this.registrationId,
                tempToken: this.tempToken,
                whatsAppCode: this.whatsappForm.controls.whatsAppCode.getRawValue()
            })
            .subscribe({
                next: (response) => {
                    this.isCompleted = true;
                    this.stopTimer();
                    this.infoMessage = response.message;
                    this.isLoading = false;
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.errorMessage = this.extractErrorMessage(error);
                    this.isLoading = false;
                }
            });
    }

    resetFlow(): void {
        this.currentStep = 1;
        this.isCompleted = false;
        this.registrationId = null;
        this.tempToken = null;
        this.errorMessage = null;
        this.infoMessage = null;
        this.initiateForm.reset();
        this.emailForm.reset();
        this.whatsappForm.reset();
        this.stopTimer();
        this.remainingSeconds = 0;
    }

    ngOnDestroy(): void {
        this.stopTimer();
    }

    private startTimer(initialSeconds: number): void {
        this.stopTimer();
        this.remainingSeconds = initialSeconds;

        this.timerSubscription = interval(1000).subscribe(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds -= 1;
            }

            if (this.remainingSeconds <= 0) {
                this.stopTimer();
                this.errorMessage = 'Время подтверждения истекло. Начните регистрацию заново.';
            }
        });
    }

    private stopTimer(): void {
        this.timerSubscription?.unsubscribe();
        this.timerSubscription = null;
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Произошла ошибка. Попробуйте еще раз.';
    }
}
