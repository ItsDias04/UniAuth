import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthSessionService } from '@/@core/contexts/security/auth-session.service';
import { DevelopersConsoleService } from '@/@core/contexts/developers-console/developers-console.service';
import { Oauth2SsoService } from '@/@core/contexts/oauth2/oauth2-sso.service';

@Component({
    selector: 'app-external-redirect-bridge',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, MessageModule],
    templateUrl: './external-redirect-bridge.component.html',
    styleUrl: './external-redirect-bridge.component.scss'
})
export class ExternalRedirectBridgeComponent implements OnInit {
    loading = false;
    errorMessage = '';
    infoMessage = '';

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly authSessionService: AuthSessionService,
        private readonly developersConsoleService: DevelopersConsoleService,
        private readonly oauth2SsoService: Oauth2SsoService
    ) {}

    ngOnInit(): void {
        void this.handleFlow();
    }

    async handleFlow(): Promise<void> {
        this.errorMessage = '';
        this.infoMessage = '';

        const applicationId = this.route.snapshot.queryParamMap.get('applicationId') ?? '';
        const redirectUri = this.route.snapshot.queryParamMap.get('redirectUri') ?? '';
        const state = this.route.snapshot.queryParamMap.get('state') ?? undefined;
        let externalToken = this.route.snapshot.queryParamMap.get('externalToken') ?? '';

        if (!applicationId || !redirectUri) {
            this.errorMessage = 'Требуются query параметры applicationId и redirectUri';
            return;
        }

        if (!this.authSessionService.isAuthenticated()) {
            await this.router.navigate(['/auth/login'], {
                queryParams: { returnUrl: this.router.url }
            });
            return;
        }

        this.loading = true;
        this.infoMessage = 'Подготовка внешнего redirect token...';

        try {
            if (!externalToken) {
                externalToken = await this.requestExternalToken(applicationId);
            }

            const redirectUrl = await this.authorize(applicationId, redirectUri, externalToken, state);
            window.location.href = redirectUrl;
            return;
        } catch (error) {
            if (this.isExternalTokenInvalid(error)) {
                try {
                    this.infoMessage = 'Токен истек/невалиден. Запрашиваю новый...';
                    externalToken = await this.requestExternalToken(applicationId);
                    const redirectUrl = await this.authorize(applicationId, redirectUri, externalToken, state);
                    window.location.href = redirectUrl;
                    return;
                } catch (retryError) {
                    this.errorMessage = this.extractErrorMessage(retryError);
                }
            } else {
                this.errorMessage = this.extractErrorMessage(error);
            }
        } finally {
            this.loading = false;
        }
    }

    private requestExternalToken(applicationId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.developersConsoleService.issueExternalRedirectToken(applicationId).subscribe({
                next: (response) => resolve(response.token),
                error: (error: unknown) => reject(error)
            });
        });
    }

    private authorize(applicationId: string, redirectUri: string, externalToken: string, state?: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.oauth2SsoService
                .authorize({
                    clientId: applicationId,
                    redirectUri,
                    externalToken,
                    state
                })
                .subscribe({
                    next: (response) => {
                        if (!response.redirectUrl) {
                            reject(new Error('Redirect URL не получен'));
                            return;
                        }
                        resolve(response.redirectUrl);
                    },
                    error: (error: unknown) => reject(error)
                });
        });
    }

    private isExternalTokenInvalid(error: unknown): boolean {
        const text = this.extractErrorMessage(error).toLowerCase();
        return text.includes('invalid') || text.includes('expired') || text.includes('external token');
    }

    private extractErrorMessage(error: unknown): string {
        const err = error as { error?: { message?: string | string[] } };
        const message = err?.error?.message;
        if (Array.isArray(message)) {
            return message.join(' ');
        }
        return message ?? 'Не удалось выполнить redirect flow.';
    }
}
