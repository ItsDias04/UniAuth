import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { ExternalSystemService, ExternalClientResponse } from '../service/external-system.service';

@Component({
    selector: 'app-external-clients-list',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, TableModule, TagModule, ToolbarModule, TooltipModule],
    template: `
        <div class="card">
            <p-toolbar styleClass="mb-6">
                <ng-template #start>
                    <h2 class="m-0">Внешние системы (OAuth2 клиенты)</h2>
                </ng-template>
                <ng-template #end>
                    <p-button label="Зарегистрировать клиента" icon="pi pi-plus" routerLink="/pages/external-systems/register" />
                </ng-template>
            </p-toolbar>

            <p-table [value]="clients" [rows]="10" [paginator]="true" [rowHover]="true"
                     [showCurrentPageReport]="true" currentPageReportTemplate="Показано {first} - {last} из {totalRecords}"
                     [loading]="loading">
                <ng-template #header>
                    <tr>
                        <th>Имя</th>
                        <th>Client ID</th>
                        <th>Grant Types</th>
                        <th>Scopes</th>
                        <th>Статус</th>
                        <th>Создан</th>
                        <th>Действия</th>
                    </tr>
                </ng-template>
                <ng-template #body let-client>
                    <tr>
                        <td>
                            <div class="font-semibold">{{ client.name }}</div>
                            <div class="text-muted-color text-sm">{{ client.description }}</div>
                        </td>
                        <td>
                            <code class="text-sm">{{ client.clientId }}</code>
                        </td>
                        <td>
                            @for (gt of client.allowedGrantTypes; track gt) {
                                <p-tag [value]="gt" severity="info" styleClass="mr-1 mb-1" />
                            }
                        </td>
                        <td>
                            @for (scope of client.allowedScopes; track scope) {
                                <p-tag [value]="scope" severity="secondary" styleClass="mr-1 mb-1" />
                            }
                        </td>
                        <td>
                            <p-tag [value]="client.status"
                                   [severity]="client.status === 'active' ? 'success' : 'danger'" />
                        </td>
                        <td>{{ client.createdAt | date:'dd.MM.yyyy HH:mm' }}</td>
                        <td>
                            <p-button icon="pi pi-trash" severity="danger" [text]="true" pTooltip="Отозвать"
                                      (onClick)="onRevoke(client)" [disabled]="client.status !== 'active'" />
                        </td>
                    </tr>
                </ng-template>
                <ng-template #emptymessage>
                    <tr>
                        <td colspan="7" class="text-center p-8">
                            <div class="flex flex-col items-center gap-4">
                                <i class="pi pi-link text-4xl text-muted-color"></i>
                                <span class="text-muted-color">Нет зарегистрированных внешних систем</span>
                                <p-button label="Зарегистрировать первого клиента" icon="pi pi-plus" routerLink="/pages/external-systems/register" />
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class ExternalClientsList implements OnInit {
    clients: ExternalClientResponse[] = [];
    loading: boolean = false;

    constructor(private externalSystemService: ExternalSystemService) {}

    ngOnInit(): void {
        this.loadClients();
    }

    loadClients(): void {
        this.loading = true;
        this.externalSystemService.getMyClients().subscribe({
            next: (data) => {
                this.clients = data;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
    }

    onRevoke(client: ExternalClientResponse): void {
        if (confirm(`Вы уверены, что хотите отозвать клиента "${client.name}"?`)) {
            this.externalSystemService.revokeClient(client.id).subscribe({
                next: () => this.loadClients(),
            });
        }
    }
}
