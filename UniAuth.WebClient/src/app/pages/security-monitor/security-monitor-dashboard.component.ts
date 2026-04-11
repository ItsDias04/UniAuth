import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';
import { SecurityMonitoringEvent, SecurityMonitoringQuery, SecurityMonitoringService, SecurityMonitoringSummary } from '@/@core/contexts/security/security-monitoring.service';

type DashboardTab = 'all' | 'suspicious' | 'prevented';

@Component({
    selector: 'app-security-monitor-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule],
    templateUrl: './security-monitor-dashboard.component.html',
    styleUrl: './security-monitor-dashboard.component.scss'
})
export class SecurityMonitorDashboardComponent {
    activeTab: DashboardTab = 'all';

    loadingEvents = false;
    loadingSummary = false;
    loadingDownload = false;
    errorMessage = '';
    infoMessage = '';

    search = '';
    from = '';
    to = '';
    excludeCurrentOfficer = true;

    limit = 30;
    offset = 0;
    total = 0;

    events: SecurityMonitoringEvent[] = [];
    summary: SecurityMonitoringSummary | null = null;
    expandedEventId: string | null = null;

    constructor(
        private readonly securityMonitoringService: SecurityMonitoringService,
        private readonly authSessionService: AuthSessionService,
        private readonly router: Router
    ) {}

    ngOnInit(): void {
        this.validateOfficerSession();
    }

    setTab(tab: DashboardTab): void {
        this.activeTab = tab;
        this.offset = 0;
        this.expandedEventId = null;
        this.loadEvents();
    }

    applyFilters(): void {
        this.offset = 0;
        this.expandedEventId = null;
        this.loadEvents();
    }

    clearFilters(): void {
        this.search = '';
        this.from = '';
        this.to = '';
        this.offset = 0;
        this.expandedEventId = null;
        this.loadEvents();
    }

    refresh(): void {
        this.loadSummary();
        this.loadEvents();
    }

    downloadLogs(): void {
        this.loadingDownload = true;
        this.errorMessage = '';
        this.infoMessage = '';

        this.securityMonitoringService.downloadEvents(this.buildQuery(true)).subscribe({
            next: (blob) => {
                this.loadingDownload = false;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `security-logs-${this.activeTab}-${timestamp}.csv`;

                const objectUrl = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = objectUrl;
                anchor.download = fileName;
                anchor.click();
                URL.revokeObjectURL(objectUrl);

                this.infoMessage = 'Экспорт логов завершен';
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.loadingDownload = false;
                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    goPrev(): void {
        if (this.offset === 0) {
            return;
        }

        this.offset = Math.max(this.offset - this.limit, 0);
        this.expandedEventId = null;
        this.loadEvents();
    }

    goNext(): void {
        if (this.offset + this.limit >= this.total) {
            return;
        }

        this.offset += this.limit;
        this.expandedEventId = null;
        this.loadEvents();
    }

    toggleEventDetails(eventId: string): void {
        this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
    }

    logoutOfficer(): void {
        this.authSessionService.clearSecurityOfficerSession();
        void this.router.navigateByUrl('/security-monitor/login');
    }

    categoryLabel(category: SecurityMonitoringEvent['category']): string {
        if (category === 'prevented') return 'Предотвращено';
        if (category === 'suspicious') return 'Подозрительно';
        return 'Нормально';
    }

    tabLabel(tab: DashboardTab): string {
        if (tab === 'suspicious') return 'Подозрительные';
        if (tab === 'prevented') return 'Предотвращённые';
        return 'Все логи';
    }

    severityClass(category: SecurityMonitoringEvent['category']): string {
        if (category === 'prevented') return 'sev-prevented';
        if (category === 'suspicious') return 'sev-suspicious';
        return 'sev-normal';
    }

    asPretty(value: unknown): string {
        if (value === null || value === undefined) {
            return '-';
        }

        if (typeof value === 'string') {
            return value;
        }

        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    formatDate(value: string): string {
        const date = new Date(value);
        return date.toLocaleString();
    }

    private validateOfficerSession(): void {
        this.securityMonitoringService.getOfficerSession().subscribe({
            next: () => {
                this.loadSummary();
                this.loadEvents();
            },
            error: () => {
                this.authSessionService.clearSecurityOfficerSession();
                void this.router.navigateByUrl('/security-monitor/login');
            }
        });
    }

    private loadSummary(): void {
        this.loadingSummary = true;
        this.securityMonitoringService.getSummary(24).subscribe({
            next: (summary) => {
                this.loadingSummary = false;
                this.summary = summary;
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.loadingSummary = false;
                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    private loadEvents(): void {
        this.loadingEvents = true;
        this.errorMessage = '';
        this.infoMessage = '';

        const query = this.buildQuery();

        const request =
            this.activeTab === 'suspicious' ? this.securityMonitoringService.getSuspiciousEvents(query) : this.activeTab === 'prevented' ? this.securityMonitoringService.getPreventedEvents(query) : this.securityMonitoringService.getEvents(query);

        request.subscribe({
            next: (response) => {
                this.loadingEvents = false;
                this.events = response.items;
                this.total = response.total;
            },
            error: (error: { error?: { message?: string | string[] } }) => {
                this.loadingEvents = false;
                this.errorMessage = this.extractErrorMessage(error);
            }
        });
    }

    private buildQuery(withCategory = false): SecurityMonitoringQuery {
        const query: SecurityMonitoringQuery = {
            search: this.search,
            limit: this.limit,
            offset: this.offset,
            from: this.toIsoDate(this.from),
            to: this.toIsoDate(this.to),
            excludeCurrentOfficer: this.excludeCurrentOfficer
        };

        if (withCategory) {
            query.category = this.resolveCategory(this.activeTab);
        }

        return query;
    }

    private resolveCategory(tab: DashboardTab): SecurityMonitoringQuery['category'] {
        if (tab === 'suspicious') {
            return 'suspicious';
        }

        if (tab === 'prevented') {
            return 'prevented';
        }

        return undefined;
    }

    private toIsoDate(rawValue: string): string | undefined {
        if (!rawValue) {
            return undefined;
        }

        const parsed = new Date(rawValue);
        if (Number.isNaN(parsed.getTime())) {
            return undefined;
        }

        return parsed.toISOString();
    }

    private extractErrorMessage(error: { error?: { message?: string | string[] } }): string {
        const message = error.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }

        return message ?? 'Не удалось загрузить данные мониторинга безопасности';
    }
}
