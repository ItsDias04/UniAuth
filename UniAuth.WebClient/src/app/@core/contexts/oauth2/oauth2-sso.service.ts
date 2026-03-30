import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface VerifyToken1Response {
    token3: string;
    expiresInSeconds: number;
    redirectUrl: string;
}

export interface IntrospectToken3Response {
    status: 'OK' | 'ERROR';
    reason?: string;
    user?: {
        userId: string;
        clientId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    };
}

export interface GenerateAuthCodeRequest {
    clientId: string;
    redirectUri: string;
    externalToken: string;
    state?: string;
}

export interface GenerateAuthCodeResponse {
    authorizationCode: string;
    expiresInSeconds: number;
    redirectUrl: string;
}

export interface ValidateTemporaryTokenResponse {
    valid: boolean;
    reason?: string;
    user?: {
        userId: string;
        clientId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
    };
}

@Injectable({
    providedIn: 'root'
})
export class Oauth2SsoService {
    private readonly baseUrl = `${environment.apiUrl}/oauth2/sso`;

    constructor(private readonly http: HttpClient) {}

    verifyToken1(token1: string): Observable<VerifyToken1Response> {
        return this.http.post<VerifyToken1Response>(`${this.baseUrl}/verify-token-1`, {
            token1
        });
    }

    introspectToken3(token3: string): Observable<IntrospectToken3Response> {
        return this.http.post<IntrospectToken3Response>(`${this.baseUrl}/introspect-token-3`, {
            token3
        });
    }

    // Backward-compatible wrapper for legacy screens.
    authorize(payload: GenerateAuthCodeRequest): Observable<GenerateAuthCodeResponse> {
        return this.verifyToken1(payload.externalToken).pipe(
            map((response) => ({
                authorizationCode: response.token3,
                expiresInSeconds: response.expiresInSeconds,
                redirectUrl: response.redirectUrl
            }))
        );
    }

    // Backward-compatible wrapper for legacy screens.
    validateTemporaryToken(authorizationCode: string): Observable<ValidateTemporaryTokenResponse> {
        return this.introspectToken3(authorizationCode).pipe(
            map((response) => {
                if (response.status === 'OK') {
                    return {
                        valid: true,
                        user: response.user
                    } satisfies ValidateTemporaryTokenResponse;
                }

                return {
                    valid: false,
                    reason: response.reason
                } satisfies ValidateTemporaryTokenResponse;
            })
        );
    }
}
