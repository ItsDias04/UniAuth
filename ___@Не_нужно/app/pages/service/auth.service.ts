import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LoginRequest {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    displayName: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    mfaRequired?: boolean;
    mfaChallengeId?: string;
}

export interface MfaVerifyRequest {
    challengeId: string;
    code: string;
}

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    status: string;
    mfaEnabled: boolean;
    roles: string[];
    lastLoginAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly apiUrl = environment.apiUrl;
    private readonly TOKEN_KEY = 'ua_access_token';
    private readonly REFRESH_KEY = 'ua_refresh_token';

    private _isAuthenticated = signal(this.hasToken());
    private _currentUser = signal<UserProfile | null>(null);
    private _mfaRequired = signal(false);
    private _mfaChallengeId = signal<string | null>(null);

    readonly isAuthenticated = this._isAuthenticated.asReadonly();
    readonly currentUser = this._currentUser.asReadonly();
    readonly mfaRequired = this._mfaRequired.asReadonly();
    readonly mfaChallengeId = this._mfaChallengeId.asReadonly();

    constructor(
        private readonly http: HttpClient,
        private readonly router: Router,
    ) {
        if (this.hasToken()) {
            this.loadProfile();
        }
    }

    /**
     * Вход в систему.
     */
    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, request).pipe(
            tap((response) => {
                if (response.mfaRequired) {
                    this._mfaRequired.set(true);
                    this._mfaChallengeId.set(response.mfaChallengeId || null);
                    return;
                }
                this.storeTokens(response);
                this._isAuthenticated.set(true);
                this._mfaRequired.set(false);
                this.loadProfile();
            }),
            catchError((error) => {
                return throwError(() => error);
            }),
        );
    }

    /**
     * Регистрация нового пользователя.
     */
    register(request: RegisterRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/register`, request);
    }

    /**
     * Подтверждение MFA (TOTP).
     */
    verifyMfa(request: MfaVerifyRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/mfa/totp/verify`, request).pipe(
            tap((response) => {
                this.storeTokens(response);
                this._isAuthenticated.set(true);
                this._mfaRequired.set(false);
                this._mfaChallengeId.set(null);
                this.loadProfile();
            }),
        );
    }

    /**
     * Выход из системы.
     */
    logout(): void {
        const refreshToken = localStorage.getItem(this.REFRESH_KEY);
        if (refreshToken) {
            this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({
                error: () => {},
            });
        }
        this.clearTokens();
        this._isAuthenticated.set(false);
        this._currentUser.set(null);
        this._mfaRequired.set(false);
        this.router.navigate(['/auth/login']);
    }

    /**
     * Загрузка профиля текущего пользователя.
     */
    loadProfile(): void {
        this.http.get<UserProfile>(`${this.apiUrl}/users/me`).subscribe({
            next: (user) => this._currentUser.set(user),
            error: () => {
                this.clearTokens();
                this._isAuthenticated.set(false);
            },
        });
    }

    /**
     * Обновление access token.
     */
    refreshToken(): Observable<AuthResponse> {
        const refreshToken = localStorage.getItem(this.REFRESH_KEY);
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token'));
        }
        return this.http.post<AuthResponse>(`${this.apiUrl}/token/refresh`, { refreshToken }).pipe(
            tap((response) => this.storeTokens(response)),
            catchError((error) => {
                this.logout();
                return throwError(() => error);
            }),
        );
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private hasToken(): boolean {
        return !!localStorage.getItem(this.TOKEN_KEY);
    }

    private storeTokens(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    }

    private clearTokens(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_KEY);
    }
}
