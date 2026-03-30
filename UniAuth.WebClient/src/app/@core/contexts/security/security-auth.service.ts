import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InitiateLoginRequest {
    email: string;
    password: string;
}

export interface InitiateLoginResponse {
    mfaRequired: boolean;
    message: string;
    mfaToken?: string;
    expiresInSeconds?: number;
    accessToken?: string;
    refreshToken?: string;
}

export interface VerifyMfaAndLoginRequest {
    mfaToken: string;
    code: string;
}

export interface VerifyMfaAndLoginResponse {
    accessToken: string;
    refreshToken: string;
    message: string;
}

export interface CurrentLoginSessionResponse {
    status: 'OK';
    userId: string;
}

@Injectable({
    providedIn: 'root'
})
export class SecurityAuthService {
    private readonly baseUrl = `${environment.apiUrl}/security/login`;

    constructor(private readonly http: HttpClient) {}

    initiate(payload: InitiateLoginRequest): Observable<InitiateLoginResponse> {
        return this.http.post<InitiateLoginResponse>(`${this.baseUrl}/initiate`, payload);
    }

    current(): Observable<CurrentLoginSessionResponse> {
        return this.http.get<CurrentLoginSessionResponse>(`${this.baseUrl}/current`);
    }

    verifyMfa(payload: VerifyMfaAndLoginRequest): Observable<VerifyMfaAndLoginResponse> {
        return this.http.post<VerifyMfaAndLoginResponse>(`${this.baseUrl}/verify-mfa`, payload);
    }
}
