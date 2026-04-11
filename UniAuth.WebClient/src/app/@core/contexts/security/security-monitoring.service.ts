import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type SecurityEventCategory = 'normal' | 'suspicious' | 'prevented';

export interface SecurityOfficerLoginRequest {
    login: string;
    password: string;
}

export interface SecurityOfficerLoginResponse {
    accessToken: string;
    tokenType: 'Bearer';
    expiresInSeconds: number;
    login: string;
}

export interface SecurityOfficerSessionResponse {
    status: 'OK';
    login: string;
    role: string;
    permissions: string[];
}

export interface SecurityMonitoringEvent {
    id: string;
    createdAt: string;
    category: SecurityEventCategory;
    eventType: string;
    method: string;
    path: string;
    responseStatus: number;
    durationMs: number;
    ipAddress: string;
    userAgent: string | null;
    userId: string | null;
    reasons: string[];
    requestId: string | null;
    query: unknown;
    requestHeaders: unknown;
    requestBody: unknown;
    responseBody: unknown;
}

export interface SecurityMonitoringEventsPage {
    items: SecurityMonitoringEvent[];
    total: number;
    limit: number;
    offset: number;
}

export interface SecurityMonitoringSummary {
    periodHours: number;
    totalEvents: number;
    normalEvents: number;
    suspiciousEvents: number;
    preventedEvents: number;
    uniqueIpAddresses: number;
    alertedEvents: number;
    topReasons: Array<{ reason: string; count: number }>;
}

export interface SecurityMonitoringQuery {
    search?: string;
    limit?: number;
    offset?: number;
    from?: string;
    to?: string;
    category?: SecurityEventCategory;
    excludeCurrentOfficer?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SecurityMonitoringService {
    private readonly baseUrl = `${environment.apiUrl}/security-monitoring`;

    constructor(private readonly http: HttpClient) {}

    loginOfficer(payload: SecurityOfficerLoginRequest): Observable<SecurityOfficerLoginResponse> {
        return this.http.post<SecurityOfficerLoginResponse>(`${this.baseUrl}/officer/login`, payload);
    }

    getOfficerSession(): Observable<SecurityOfficerSessionResponse> {
        return this.http.get<SecurityOfficerSessionResponse>(`${this.baseUrl}/officer/session`);
    }

    getEvents(query: SecurityMonitoringQuery): Observable<SecurityMonitoringEventsPage> {
        return this.http.get<SecurityMonitoringEventsPage>(`${this.baseUrl}/events`, {
            params: this.toParams(query)
        });
    }

    getSuspiciousEvents(query: SecurityMonitoringQuery): Observable<SecurityMonitoringEventsPage> {
        return this.http.get<SecurityMonitoringEventsPage>(`${this.baseUrl}/events/suspicious`, {
            params: this.toParams(query)
        });
    }

    getPreventedEvents(query: SecurityMonitoringQuery): Observable<SecurityMonitoringEventsPage> {
        return this.http.get<SecurityMonitoringEventsPage>(`${this.baseUrl}/events/prevented`, {
            params: this.toParams(query)
        });
    }

    getSummary(hours = 24): Observable<SecurityMonitoringSummary> {
        return this.http.get<SecurityMonitoringSummary>(`${this.baseUrl}/summary`, {
            params: new HttpParams().set('hours', String(hours))
        });
    }

    downloadEvents(query: SecurityMonitoringQuery): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/events/export`, {
            params: this.toParams(query),
            responseType: 'blob'
        });
    }

    private toParams(query: SecurityMonitoringQuery): HttpParams {
        let params = new HttpParams();

        if (query.search?.trim()) {
            params = params.set('search', query.search.trim());
        }
        if (query.limit !== undefined) {
            params = params.set('limit', String(query.limit));
        }
        if (query.offset !== undefined) {
            params = params.set('offset', String(query.offset));
        }
        if (query.from) {
            params = params.set('from', query.from);
        }
        if (query.to) {
            params = params.set('to', query.to);
        }
        if (query.category) {
            params = params.set('category', query.category);
        }
        if (query.excludeCurrentOfficer !== undefined) {
            params = params.set('excludeCurrentOfficer', String(query.excludeCurrentOfficer));
        }

        return params;
    }
}
