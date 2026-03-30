import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { StepperModule } from 'primeng/stepper';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DeveloperApplication, DevelopersConsoleService, GenerateApplicationApiTokenResponse, IssueExternalRedirectTokenResponse, RequestIpOwnershipVerificationResponse } from '@/@core/contexts/developers-console/developers-console.service';

@Component({
    selector: 'app-developer-application-details',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, MessageModule, TagModule, ChipModule, StepperModule, ToastModule],
    providers: [MessageService],
    templateUrl: './developer-application-details.component.html',
    styleUrl: './developer-application-details.component.scss'
})
export class DeveloperApplicationDetailsComponent implements OnInit {
    application: DeveloperApplication | null = null;
    loading = false;
    actionLoading = false;
    errorMessage = '';
    successMessage = '';
    currentStep = 0;

    editRedirectRoute = '';
    editIp = '';
    ipVerification: RequestIpOwnershipVerificationResponse | null = null;
    redirectToken: IssueExternalRedirectTokenResponse | null = null;
    generatedApiToken: string | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly developersConsoleService: DevelopersConsoleService,
        private readonly messageService: MessageService
    ) {}

    ngOnInit(): void {
        const applicationId = this.route.snapshot.paramMap.get('applicationId');
        if (!applicationId) {
            this.showError('Application ID не найден в маршруте');
            return;
        }

        this.loadApplication(applicationId);
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'production':
                return 'success';
            case 'active':
                return 'info';
            case 'inactive':
                return 'danger';
            case 'draft':
                return 'warning';
            case 'IpVerificationPending':
                return 'warning';
            case 'NeedsAddRoute':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    getActiveStepIndex(): number {
        if (this.application?.status === 'production') {
            return 2;
        } else if (this.application?.ipIsVerified && this.application.redirectRoute) {
            return 1;
        }
        return 0;
    }

    getCurrentStep(): number {
        return this.currentStep;
    }

    setIp(): void {
        if (!this.application || !this.editIp) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.setApplicationIp(this.application.applicationId, this.editIp).subscribe({
            next: () => {
                this.actionLoading = false;
                this.showSuccess('IP успешно установлен');
                if (this.application) {
                    this.application.ip = this.editIp;
                    this.application.ipIsVerified = false;
                }
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    saveRoute(): void {
        if (!this.application || !this.editRedirectRoute) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.setApplicationRoute(this.application.applicationId, this.editRedirectRoute).subscribe({
            next: (response) => {
                this.actionLoading = false;
                this.showSuccess('Route успешно сохранён');
                if (this.application) {
                    this.application.redirectRoute = response.redirectRoute;
                }
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    requestIpVerification(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.actionLoading = true;
        this.ipVerification = null;

        this.developersConsoleService.requestIpOwnershipVerification(this.application.applicationId).subscribe({
            next: (response) => {
                this.actionLoading = false;
                this.ipVerification = response;
                this.showSuccess('Token верификации успешно создан');
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    launchToProduction(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.launchApplicationToProduction(this.application.applicationId).subscribe({
            next: (response) => {
                this.actionLoading = false;
                this.showSuccess('🚀 Приложение запущено в продакшн!');
                if (this.application) {
                    this.application.status = response.status as any;
                }
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    toggleStatus(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.toggleApplicationStatus(this.application.applicationId).subscribe({
            next: (response) => {
                this.actionLoading = false;
                this.showSuccess(`Статус изменён на: ${response.status}`);
                if (this.application) {
                    this.application.status = response.status as any;
                }
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('Скопировано в буфер обмена');
        });
    }

    issueRedirectToken(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.actionLoading = true;
        this.redirectToken = null;

        this.developersConsoleService.issueExternalRedirectToken(this.application.applicationId).subscribe({
            next: (response) => {
                this.actionLoading = false;
                this.redirectToken = response;
                this.showSuccess('Redirect token успешно сгенерирован');
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    startOauth2Test(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.issueExternalRedirectToken(this.application.applicationId).subscribe({
            next: (response) => {
                this.actionLoading = false;
                void this.router.navigate(['/oauth2/external-redirect', response.token1]);
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    generateApiToken(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.actionLoading = true;

        this.developersConsoleService.generateApplicationApiToken(this.application.applicationId).subscribe({
            next: (response: GenerateApplicationApiTokenResponse) => {
                this.actionLoading = false;
                this.generatedApiToken = response.apiToken;
                this.showSuccess('API token сгенерирован. Сохраните его во внешнем сервисе.');
                if (this.application) {
                    this.application.hasApiToken = true;
                }
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    private loadApplication(applicationId: string): void {
        this.loading = true;
        this.errorMessage = '';

        this.developersConsoleService.getApplicationById(applicationId).subscribe({
            next: (application) => {
                this.loading = false;
                this.application = application;
                this.editIp = application.ip;
                this.editRedirectRoute = application.redirectRoute;
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.loading = false;
                this.showError(this.extractErrorMessage(error));
            }
        });
    }

    private showSuccess(message: string): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Успешно',
            detail: message,
            life: 3000
        });
    }

    private showError(message: string): void {
        this.messageService.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: message,
            life: 4000
        });
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Произошла ошибка. Попробуйте снова.';
    }
}
