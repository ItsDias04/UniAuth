import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ExternalClientResponse {
    id: string;
    name: string;
    description: string;
    clientId: string;
    clientSecret?: string;
    redirectUris: string[];
    allowedGrantTypes: string[];
    allowedScopes: string[];
    status: string;
    homepageUrl: string | null;
    logoUrl: string | null;
    createdAt: string;
}

export interface RegisterClientRequest {
    name: string;
    description: string;
    redirectUris: string[];
    allowedGrantTypes: string[];
    allowedScopes: string[];
    homepageUrl?: string;
    logoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ExternalSystemService {
    private readonly apiUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) {}

    /**
     * Получить мои зарегистрированные клиенты.
     */
    getMyClients(): Observable<ExternalClientResponse[]> {
        return this.http.get<ExternalClientResponse[]>(`${this.apiUrl}/external-clients/my`);
    }

    /**
     * Получить все клиенты (admin).
     */
    getAllClients(): Observable<ExternalClientResponse[]> {
        return this.http.get<ExternalClientResponse[]>(`${this.apiUrl}/external-clients`);
    }

    /**
     * Зарегистрировать нового OAuth2 клиента.
     */
    registerClient(request: RegisterClientRequest): Observable<{ message: string; data: { id: string; clientId: string; clientSecret: string } }> {
        return this.http.post<{ message: string; data: { id: string; clientId: string; clientSecret: string } }>(
            `${this.apiUrl}/external-clients`,
            request,
        );
    }

    /**
     * Отозвать клиента.
     */
    revokeClient(id: string, reason: string = ''): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/external-clients/${id}`, {
            body: { reason },
        });
    }
}
