import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DeveloperApplication {
    applicationId: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    status: 'draft' | 'active' | 'inactive' | 'production';
    ip: string;
    ipIsVerified: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface GetOwnerApplicationsResponse {
    items: DeveloperApplication[];
}

export interface CreateApplicationRequest {
    name: string;
}

export interface CreateApplicationResponse {
    applicationId: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    status: 'draft' | 'active' | 'inactive' | 'production';
}

export interface UpdateApplicationSettingsRequest {
    name?: string;
    redirectRoute?: string;
}

export interface UpdateApplicationSettingsResponse {
    applicationId: string;
    name: string;
    redirectRoute: string;
    status: 'draft' | 'active' | 'inactive' | 'production';
}

export interface RequestIpOwnershipVerificationResponse {
    token: string;
    expiresInSeconds: number;
    confirmationHint: string;
}

export interface IssueExternalRedirectTokenResponse {
    token: string;
    expiresInSeconds: number;
    redirectUrl: string;
}

@Injectable({
    providedIn: 'root'
})
export class DevelopersConsoleService {
    private readonly baseUrl = `${environment.apiUrl}/developers-console`;

    constructor(private readonly http: HttpClient) {}

    getOwnerApplications(): Observable<GetOwnerApplicationsResponse> {
        return this.http.get<GetOwnerApplicationsResponse>(`${this.baseUrl}/applications`);
    }

    getApplicationById(applicationId: string): Observable<DeveloperApplication> {
        return this.http.get<DeveloperApplication>(`${this.baseUrl}/applications/${applicationId}`);
    }

    createApplication(payload: CreateApplicationRequest): Observable<CreateApplicationResponse> {
        return this.http.post<CreateApplicationResponse>(`${this.baseUrl}/applications`, payload);
    }

    updateApplicationSettings(applicationId: string, payload: UpdateApplicationSettingsRequest): Observable<UpdateApplicationSettingsResponse> {
        return this.http.post<UpdateApplicationSettingsResponse>(`${this.baseUrl}/applications/${applicationId}/settings`, payload);
    }

    requestIpOwnershipVerification(applicationId: string): Observable<RequestIpOwnershipVerificationResponse> {
        return this.http.post<RequestIpOwnershipVerificationResponse>(`${this.baseUrl}/applications/${applicationId}/ip/request-verification`, {});
    }

    issueExternalRedirectToken(applicationId: string): Observable<IssueExternalRedirectTokenResponse> {
        return this.http.post<IssueExternalRedirectTokenResponse>(`${this.baseUrl}/external/redirect-token`, { applicationId });
    }

    setApplicationIp(applicationId: string, ip: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/applications/${applicationId}/ip`, { ipAddress: ip });
    }

    setApplicationRoute(applicationId: string, redirectRoute: string): Observable<UpdateApplicationSettingsResponse> {
        return this.http.post<UpdateApplicationSettingsResponse>(`${this.baseUrl}/applications/${applicationId}/redirect-route`, { redirectRoute });
    }

    launchApplicationToProduction(applicationId: string): Observable<{ applicationId: string; status: string }> {
        return this.http.post<{ applicationId: string; status: string }>(`${this.baseUrl}/applications/${applicationId}/launch-production`, {});
    }

    toggleApplicationStatus(applicationId: string): Observable<{ applicationId: string; status: string }> {
        return this.http.post<{ applicationId: string; status: string }>(`${this.baseUrl}/applications/${applicationId}/toggle-status`, {});
    }
}
