import {
  Body,
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { GenerateAuthCodeCommand } from '../application/commands/generate-auth-code.command';
import { ExchangeCodeForProfileQuery } from '../application/queries/exchange-code-for-profile.query';
import {
  ExchangeCodeForProfileDto,
  GenerateSsoAuthCodeDto,
} from './dto/oauth2-sso.dto';

@ApiTags('OAuth2 SSO')
@Controller('oauth2/sso')
export class Oauth2SsoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate short-lived authorization code for external SSO client' })
  @ApiBody({ type: GenerateSsoAuthCodeDto })
  @ApiOkResponse({
    description: 'Authorization code issued for already authenticated user session',
  })
  async authorize(
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateSsoAuthCodeDto,
  ) {
    const output = await this.commandBus.execute(
      new GenerateAuthCodeCommand(
        userId,
        dto.clientId,
        dto.redirectUri,
        dto.externalToken,
      ),
    );

    let redirectUrl: string | null = null;
    if (dto.redirectUri) {
      const url = new URL(dto.redirectUri);
      url.searchParams.set('code', output.authorizationCode);
      if (dto.state) {
        url.searchParams.set('state', dto.state);
      }
      redirectUrl = url.toString();
    }

    return {
      authorizationCode: output.authorizationCode,
      expiresInSeconds: output.expiresInSeconds,
      redirectUrl,
    };
  }

  @Public()
  @Post('exchange-profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange authorization code for user profile' })
  @ApiBody({ type: ExchangeCodeForProfileDto })
  @ApiOkResponse({
    description: 'User profile resolved via IAM anti-corruption service',
  })
  async exchangeProfile(@Body() dto: ExchangeCodeForProfileDto) {
    return this.queryBus.execute(
      new ExchangeCodeForProfileQuery(dto.authorizationCode),
    );
  }

  @Public()
  @Post('validate-temporary-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate temporary authorization code and return user payload' })
  @ApiBody({ type: ExchangeCodeForProfileDto })
  @ApiOkResponse({
    description: 'Validation result for external application sign-in/up flow',
    schema: {
      examples: {
        valid: {
          value: {
            valid: true,
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
        invalid: {
          value: {
            valid: false,
            reason: 'Authorization code is invalid or expired',
          },
        },
      },
    },
  })
  async validateTemporaryToken(@Body() dto: ExchangeCodeForProfileDto) {
    try {
      const user = await this.queryBus.execute(
        new ExchangeCodeForProfileQuery(dto.authorizationCode),
      );

      return {
        valid: true,
        user,
      };
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? (error.getResponse() as { message?: string }).message ||
            'Authorization code is invalid or expired'
          : 'Authorization code is invalid or expired';

      return {
        valid: false,
        reason: Array.isArray(message) ? message.join(' ') : message,
      };
    }
  }
}
