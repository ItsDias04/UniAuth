import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IOAuthClientValidator,
} from '../../application/services/oauth-client-validator.interface';

interface RegisteredClient {
  clientId: string;
  redirectUris: string[];
}

@Injectable()
export class ConfigOAuthClientValidatorService implements IOAuthClientValidator {
  private readonly clients: RegisteredClient[];

  constructor(configService: ConfigService) {
    const raw = configService.get<string>('OAUTH2_CLIENTS_JSON');

    if (!raw) {
      this.clients = [
        {
          clientId: 'developer-console-web',
          redirectUris: ['http://localhost:4200/developer-console/callback'],
        },
      ];
      return;
    }

    try {
      this.clients = JSON.parse(raw) as RegisteredClient[];
    } catch {
      this.clients = [];
    }
  }

  async validate(clientId: string, redirectUri: string): Promise<void> {
    const client = this.clients.find((item) => item.clientId === clientId);
    if (!client) {
      throw new NotFoundException('OAuth2 client is not registered');
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('Redirect URI is not allowed for this OAuth2 client');
    }
  }
}
