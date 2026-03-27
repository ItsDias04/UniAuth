import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import {
    DeveloperApplication,
    DevelopersConsoleService
} from '@/@core/contexts/developers-console/developers-console.service';

@Component({
    selector: 'app-developer-applications-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './developer-applications-list.component.html',
    styleUrl: './developer-applications-list.component.scss'
})
export class DeveloperApplicationsListComponent {
    appName = '';

    loading = false;
    creating = false;
    errorMessage = '';
    successMessage = '';

    applications: DeveloperApplication[] = [];

    constructor(private readonly developersConsoleService: DevelopersConsoleService) {}

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.errorMessage = '';
        this.successMessage = '';
        this.loading = true;

        this.developersConsoleService.getOwnerApplications().subscribe({
            next: (response) => {
                this.loading = false;
                this.applications = response.items;
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.loading = false;
                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    createApplication(): void {
        if (!this.appName.trim()) {
            this.errorMessage = 'Заполните название приложения';
            return;
        }

        this.errorMessage = '';
        this.successMessage = '';
        this.creating = true;

        this.developersConsoleService
            .createApplication({
                name: this.appName.trim()
            })
            .subscribe({
                next: () => {
                    this.creating = false;
                    this.successMessage = 'Приложение создано';
                    this.appName = '';
                    this.loadApplications();
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.creating = false;
                    this.errorMessage = this.extractErrorMessage(error);
                }
            });
    }

    statusLabel(status: DeveloperApplication['status']): string {
        if (status === 'active') return 'Активно';
        if (status === 'inactive') return 'Неактивно';
        return 'Черновик';
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Произошла ошибка. Попробуйте снова.';
    }
}
