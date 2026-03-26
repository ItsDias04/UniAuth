import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { ChipModule } from 'primeng/chip';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ExternalSystemService } from '../service/external-system.service';

@Component({
    selector: 'app-register-client',
    standalone: true,
    imports: [
        CommonModule, FormsModule, RouterModule, ButtonModule, InputTextModule,
        TextareaModule, MultiSelectModule, ChipModule, MessageModule, CardModule, DividerModule,
    ],
    template: `
        <div class="card">
            <div class="flex items-center gap-4 mb-6">
                <p-button icon="pi pi-arrow-left" [text]="true" routerLink="/pages/external-systems" />
                <h2 class="m-0">Регистрация OAuth2 клиента</h2>
            </div>

            @if (errorMessage) {
                <p-message severity="error" [text]="errorMessage" styleClass="mb-4 w-full" />
            }

            @if (registrationResult) {
                <p-card styleClass="mb-6 border-green-500 border-1">
                    <ng-template #header>
                        <div class="p-4 bg-green-50 dark:bg-green-900">
                            <h3 class="m-0 text-green-700 dark:text-green-300">
                                <i class="pi pi-check-circle mr-2"></i>Клиент успешно зарегистрирован!
                            </h3>
                        </div>
                    </ng-template>
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="font-semibold block mb-1">Client ID</label>
                            <code class="text-lg select-all">{{ registrationResult.clientId }}</code>
                        </div>
                        <p-divider />
                        <div>
                            <label class="font-semibold block mb-1 text-red-500">
                                <i class="pi pi-exclamation-triangle mr-1"></i>Client Secret (показывается только один раз!)
                            </label>
                            <code class="text-lg select-all break-all">{{ registrationResult.clientSecret }}</code>
                        </div>
                        <p-divider />
                        <p-message severity="warn" text="Сохраните Client Secret в безопасном месте. Он не будет показан повторно." styleClass="w-full" />
                        <p-button label="К списку клиентов" icon="pi pi-list" routerLink="/pages/external-systems" />
                    </div>
                </p-card>
            } @else {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-4">
                        <div>
                            <label for="name" class="block font-medium mb-2">Название приложения *</label>
                            <input pInputText id="name" [(ngModel)]="name" class="w-full" placeholder="Моё приложение" />
                        </div>

                        <div>
                            <label for="description" class="block font-medium mb-2">Описание</label>
                            <textarea pTextarea id="description" [(ngModel)]="description" class="w-full" rows="3" placeholder="Описание вашего приложения"></textarea>
                        </div>

                        <div>
                            <label for="homepageUrl" class="block font-medium mb-2">URL домашней страницы</label>
                            <input pInputText id="homepageUrl" [(ngModel)]="homepageUrl" class="w-full" placeholder="https://myapp.com" />
                        </div>

                        <div>
                            <label for="logoUrl" class="block font-medium mb-2">URL логотипа</label>
                            <input pInputText id="logoUrl" [(ngModel)]="logoUrl" class="w-full" placeholder="https://myapp.com/logo.png" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block font-medium mb-2">Redirect URIs * (по одному на строку)</label>
                            <textarea pTextarea [(ngModel)]="redirectUrisText" class="w-full" rows="3" placeholder="https://myapp.com/callback&#10;http://localhost:3000/callback"></textarea>
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Grant Types *</label>
                            <p-multiselect [options]="grantTypeOptions" [(ngModel)]="selectedGrantTypes"
                                           placeholder="Выберите типы грантов" class="w-full"
                                           optionLabel="label" optionValue="value" />
                        </div>

                        <div>
                            <label class="block font-medium mb-2">Scopes</label>
                            <p-multiselect [options]="scopeOptions" [(ngModel)]="selectedScopes"
                                           placeholder="Выберите scopes" class="w-full"
                                           optionLabel="label" optionValue="value" />
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex gap-4">
                    <p-button label="Зарегистрировать" icon="pi pi-check" [loading]="loading" (onClick)="onSubmit()" />
                    <p-button label="Отмена" icon="pi pi-times" severity="secondary" routerLink="/pages/external-systems" />
                </div>
            }
        </div>
    `
})
export class RegisterClient {
    name: string = '';
    description: string = '';
    redirectUrisText: string = '';
    homepageUrl: string = '';
    logoUrl: string = '';
    selectedGrantTypes: string[] = ['authorization_code'];
    selectedScopes: string[] = ['openid', 'profile', 'email'];
    loading: boolean = false;
    errorMessage: string = '';
    registrationResult: { id: string; clientId: string; clientSecret: string } | null = null;

    grantTypeOptions = [
        { label: 'Authorization Code', value: 'authorization_code' },
        { label: 'Client Credentials', value: 'client_credentials' },
        { label: 'Refresh Token', value: 'refresh_token' },
    ];

    scopeOptions = [
        { label: 'OpenID', value: 'openid' },
        { label: 'Profile', value: 'profile' },
        { label: 'Email', value: 'email' },
        { label: 'Read', value: 'read' },
        { label: 'Write', value: 'write' },
    ];

    constructor(
        private externalSystemService: ExternalSystemService,
        private router: Router,
    ) {}

    onSubmit(): void {
        this.errorMessage = '';

        const redirectUris = this.redirectUrisText
            .split('\n')
            .map((u) => u.trim())
            .filter((u) => u.length > 0);

        if (!this.name) {
            this.errorMessage = 'Укажите название приложения';
            return;
        }
        if (redirectUris.length === 0) {
            this.errorMessage = 'Укажите хотя бы один Redirect URI';
            return;
        }
        if (this.selectedGrantTypes.length === 0) {
            this.errorMessage = 'Выберите хотя бы один Grant Type';
            return;
        }

        this.loading = true;

        this.externalSystemService.registerClient({
            name: this.name,
            description: this.description,
            redirectUris,
            allowedGrantTypes: this.selectedGrantTypes,
            allowedScopes: this.selectedScopes,
            homepageUrl: this.homepageUrl || undefined,
            logoUrl: this.logoUrl || undefined,
        }).subscribe({
            next: (response) => {
                this.loading = false;
                this.registrationResult = response.data;
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err.error?.message || 'Ошибка регистрации клиента';
            },
        });
    }
}
