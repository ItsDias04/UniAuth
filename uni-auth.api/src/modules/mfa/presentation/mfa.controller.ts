import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { VerifyTotpDto } from '../application/dto/mfa.dto';
import { SetupTotpCommand } from '../application/commands/setup-totp.command';
import { VerifyTotpCommand } from '../application/commands/verify-totp.command';

@Controller('mfa')
@UseGuards(JwtAuthGuard)
export class MfaController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /mfa/totp/setup — Настройка TOTP (Google Authenticator).
   * Возвращает secret, QR URI и backup codes.
   */
  @Post('totp/setup')
  @HttpCode(HttpStatus.OK)
  async setupTotp(@CurrentUser('sub') userId: string) {
    return this.commandBus.execute(new SetupTotpCommand(userId));
  }

  /**
   * POST /mfa/totp/verify — Верификация TOTP кода.
   */
  @Post('totp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTotp(
    @CurrentUser('sub') userId: string,
    @Body() dto: VerifyTotpDto,
  ) {
    return this.commandBus.execute(new VerifyTotpCommand(userId, dto.code));
  }
}
