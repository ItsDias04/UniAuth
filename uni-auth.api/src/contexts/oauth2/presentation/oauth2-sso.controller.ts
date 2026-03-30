import {
  Body,
  BadRequestException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createHash } from 'crypto';
import { Request } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { GenerateAuthCodeCommand } from '../application/commands/generate-auth-code.command';
import { ExchangeCodeForProfileQuery } from '../application/queries/exchange-code-for-profile.query';
import { IntrospectToken3Dto, VerifyToken1Dto } from './dto/oauth2-sso.dto';
import { IssueExternalRedirectTokenCommand } from '../../developers-console/application/commands/issue-external-redirect-token.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../developers-console/domain/repositories/client-application.repository.interface';

@ApiTags('OAuth2 SSO')
@Controller('oauth2/sso')
export class Oauth2SsoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
  ) {}

  @Post('verify-token-1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify Token 1 with authenticated user (Token 2) and issue Token 3',
  })
  @ApiBody({ type: VerifyToken1Dto })
  @ApiOkResponse({
    description:
      'Token 3 and redirectUrl returned for external callback redirect',
  })
  async verifyToken1(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyToken1Dto,
  ) {
    const output = await this.commandBus.execute(
      new GenerateAuthCodeCommand(userId, dto.token1),
    );

    return {
      token3: output.token3,
      expiresInSeconds: output.expiresInSeconds,
      redirectUrl: output.redirectUrl,
    };
  }

  @Public()
  @Post('issue-token-1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Issue one-time Token 1 for external system using application API token',
  })
  @ApiOkResponse({
    description: 'Token 1 issued for external redirect flow',
  })
  async issueToken1(@Req() request: Request) {
    const application = await this.authenticateApplicationByApiToken(
      request.headers.authorization,
    );

    if (application.status !== 'production') {
      throw new ForbiddenException(
        'Application must be in production mode to issue Token 1',
      );
    }

    const output = await this.commandBus.execute(
      new IssueExternalRedirectTokenCommand(
        application.ownerUserId,
        application.id,
      ),
    );

    return {
      token1: output.token,
      expiresInSeconds: output.expiresInSeconds,
    };
  }

  @Public()
  @Post('introspect-token-3')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate and consume one-time Token 3' })
  @ApiBody({ type: IntrospectToken3Dto })
  @ApiOkResponse({
    description: 'Validation result for external service token exchange',
    schema: {
      examples: {
        ok: {
          value: {
            status: 'OK',
            user: {
              userId: '55be7f0f-e651-47f2-aaf8-a6f9e3f923ba',
              clientId: 'developer-console-web',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              avatarUrl: null,
            },
          },
        },
        error: {
          value: {
            status: 'ERROR',
            reason: 'Token 3 is invalid or expired',
          },
        },
      },
    },
  })
  async introspectToken3(
    @Req() request: Request,
    @Body() dto: IntrospectToken3Dto,
  ) {
    const application = await this.authenticateApplicationByApiToken(
      request.headers.authorization,
    );

    if (application.status !== 'production') {
      throw new ForbiddenException(
        'Application must be in production mode to introspect Token 3',
      );
    }

    try {
      const user = await this.queryBus.execute(
        new ExchangeCodeForProfileQuery(dto.token3),
      );

      if (user.clientId !== application.id) {
        return {
          status: 'ERROR',
          reason: 'Token 3 does not belong to this application',
        };
      }

      return {
        status: 'OK',
        user,
      };
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? (error.getResponse() as { message?: string }).message ||
            'Token 3 is invalid or expired'
          : 'Token 3 is invalid or expired';

      return {
        status: 'ERROR',
        reason: Array.isArray(message) ? message.join(' ') : message,
      };
    }
  }

  private async authenticateApplicationByApiToken(
    authorizationHeader?: string,
  ) {
    const token = this.extractBearerToken(authorizationHeader);
    const apiTokenHash = createHash('sha256').update(token).digest('hex');

    const application =
      await this.clientApplicationRepository.findByApiTokenHash(apiTokenHash);

    if (!application) {
      throw new UnauthorizedException('Invalid application API token');
    }

    return application;
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const [scheme, token] = authorizationHeader.split(' ');
    if (scheme !== 'Bearer' || !token?.trim()) {
      throw new UnauthorizedException('Invalid Authorization Bearer token');
    }

    return token.trim();
  }
}
