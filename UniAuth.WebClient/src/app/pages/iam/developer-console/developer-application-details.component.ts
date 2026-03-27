import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import {
    DeveloperApplication,
    DevelopersConsoleService,
    IssueExternalRedirectTokenResponse,
    RequestIpOwnershipVerificationResponse
} from '@/@core/contexts/developers-console/developers-console.service';

@Component({
    selector: 'app-developer-application-details',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './developer-application-details.component.html',
    styleUrl: './developer-application-details.component.scss'
})
export class DeveloperApplicationDetailsComponent implements OnInit {
    application: DeveloperApplication | null = null;
    loading = false;
    actionLoading = false;
    errorMessage = '';

    editName = '';
    editRedirectRoute = '';
    ipVerification: RequestIpOwnershipVerificationResponse | null = null;
    redirectToken: IssueExternalRedirectTokenResponse | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly developersConsoleService: DevelopersConsoleService
    ) {}

    ngOnInit(): void {
        const applicationId = this.route.snapshot.paramMap.get('applicationId');
        if (!applicationId) {
            this.errorMessage = 'Application ID не найден в маршруте';
            return;
        }

        this.loadApplication(applicationId);
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
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.actionLoading = false;
                    this.errorMessage = this.extractErrorMessage(error);
                }
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
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.actionLoading = false;
                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    saveSettings(): void {
        if (!this.application) {
            return;
        }

        this.errorMessage = '';
        this.actionLoading = true;

        this.developersConsoleService
            .updateApplicationSettings(this.application.applicationId, {
                name: this.editName,
                redirectRoute: this.editRedirectRoute
            })
            .subscribe({
                next: (updated) => {
                    this.actionLoading = false;
                    if (!this.application) {
                        return;
                    }

                    this.application = {
                        ...this.application,
                        name: updated.name,
                        redirectRoute: updated.redirectRoute
                    };
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.actionLoading = false;
                    this.errorMessage = this.extractErrorMessage(error);
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
                this.editName = application.name;
                this.editRedirectRoute = application.redirectRoute;
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
        return message ?? 'Произошла ошибка. Попробуйте снова.';
    }
}
