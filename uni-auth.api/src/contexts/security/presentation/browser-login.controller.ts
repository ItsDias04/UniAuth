import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { InitiateLoginCommand } from '../application/commands/initiate-login.command';
import { VerifyMfaAndLoginCommand } from '../application/commands/verify-mfa-and-login.command';
import { InitiateLoginDto, VerifyMfaAndLoginDto } from './dto/browser-login.dto';

@ApiTags('Security Login')
@Controller('security/login')
export class BrowserLoginController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate browser login using email and password' })
  @ApiBody({ type: InitiateLoginDto })
  @ApiOkResponse({
    description: 'Returns MFA challenge status or immediate token pair',
  })
  async initiate(@Body() dto: InitiateLoginDto) {
    return this.commandBus.execute(
      new InitiateLoginCommand(dto.email, dto.password),
    );
  }

  @Public()
  @Post('verify-mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA code and issue session tokens' })
  @ApiBody({ type: VerifyMfaAndLoginDto })
  @ApiOkResponse({ description: 'Returns access_token and refresh_token' })
  async verifyMfa(@Body() dto: VerifyMfaAndLoginDto) {
    return this.commandBus.execute(
      new VerifyMfaAndLoginCommand(dto.mfaToken, dto.code),
    );
  }
}
