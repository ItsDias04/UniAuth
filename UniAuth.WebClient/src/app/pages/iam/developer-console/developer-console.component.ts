import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { Oauth2SsoService } from '@/@core/contexts/oauth2/oauth2-sso.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-developer-console',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, MessageModule],
    templateUrl: './developer-console.component.html',
    styleUrl: './developer-console.component.scss'
})
export class DeveloperConsoleComponent {
    loading = false;
    errorMessage = '';
    infoMessage = '';
    authorizationCode = '';
    redirectUrl = '';

    constructor(private readonly oauth2SsoService: Oauth2SsoService) {}

    generateAuthorizationCode(): void {
        this.loading = true;
        this.errorMessage = '';
        this.infoMessage = '';
        this.oauth2SsoService
            .authorize({
                clientId: environment.oauthClientId,
                redirectUri: environment.oauthRedirectUri,
                externalToken: 'dummy-token-for-dev-console',
                state: 'dev-console-flow'
            })
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.authorizationCode = response.authorizationCode;
                    this.redirectUrl = response.redirectUrl ?? '';
                    this.infoMessage = 'Authorization code успешно сгенерирован';
                },
                error: (error: { error?: { message?: string | string[] } }) => {
                    this.loading = false;
                    const message = error.error?.message;
                    if (Array.isArray(message)) {
                        this.errorMessage = message.join(' ');
                        return;
                    }
                    this.errorMessage = message ?? 'Не удалось получить authorization code';
                }
            });
    }
}
