import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'uniauth.access_token';
const REFRESH_TOKEN_KEY = 'uniauth.refresh_token';

@Injectable({
    providedIn: 'root'
})
export class AuthSessionService {
    setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    getAccessToken(): string | null {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }

    clear(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }
}
