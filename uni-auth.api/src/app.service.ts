import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'UniAuth Identity Provider',
      version: '1.0.0',
      description:
        'Secure Identity Provider with Multi-Factor Authentication (MFA) support for external information systems',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        mfa: '/api/v1/mfa',
        token: '/api/v1/token',
        sessions: '/api/v1/sessions',
        audit: '/api/v1/audit',
        health: '/api/v1/health',
      },
    };
  }
}
