import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GenerateAuthCodeRequest {
    clientId: string;
    redirectUri: string;
    state?: string;
}

export interface GenerateAuthCodeResponse {
    authorizationCode: string;
    expiresInSeconds: number;
    redirectUrl: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class Oauth2SsoService {
    private readonly baseUrl = `${environment.apiUrl}/oauth2/sso`;

    constructor(private readonly http: HttpClient) {}

    authorize(payload: GenerateAuthCodeRequest): Observable<GenerateAuthCodeResponse> {
        return this.http.post<GenerateAuthCodeResponse>(`${this.baseUrl}/authorize`, payload);
    }
}
