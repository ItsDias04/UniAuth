import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  LoginToAuthenticatorDto,
  VerifyAuthenticatorEmailDto,
} from './dto/authenticator-login.dto';
import { LoginToAuthenticatorCommand } from '../application/commands/login-to-authenticator.command';
import { VerifyAuthenticatorEmailCommand } from '../application/commands/verify-authenticator-email.command';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Security Authenticator')
@Controller('security/authenticator')
export class AuthenticatorLoginController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login to authenticator app and send email verification code' })
  @ApiBody({ type: LoginToAuthenticatorDto })
  @ApiOkResponse({ description: 'Temporary login attempt created in Redis' })
  async login(@Body() dto: LoginToAuthenticatorDto) {
    return this.commandBus.execute(
      new LoginToAuthenticatorCommand(
        dto.email,
        dto.password,
        dto.deviceName,
        dto.deviceFingerprint,
      ),
    );
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email code and bind trusted device' })
  @ApiBody({ type: VerifyAuthenticatorEmailDto })
  @ApiOkResponse({ description: 'Trusted device created and secret issued' })
  async verifyEmail(@Body() dto: VerifyAuthenticatorEmailDto) {
    return this.commandBus.execute(
      new VerifyAuthenticatorEmailCommand(dto.loginAttemptId, dto.emailCode),
    );
  }
}
