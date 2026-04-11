import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  SecurityOfficerAuthService,
  SecurityOfficerTokenPayload,
} from '../../application/services/security-officer-auth.service';

export type SecurityOfficerRequest = Request & {
  securityOfficer?: SecurityOfficerTokenPayload;
};

@Injectable()
export class SecurityOfficerGuard implements CanActivate {
  constructor(
    private readonly securityOfficerAuthService: SecurityOfficerAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SecurityOfficerRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const payload = await this.securityOfficerAuthService.verifyToken(token);
    request.securityOfficer = payload;

    return true;
  }
}
