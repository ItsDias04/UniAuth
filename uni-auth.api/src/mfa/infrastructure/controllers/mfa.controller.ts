import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { MfaService } from '../../application/services/mfa.service';
import { ConfirmTotpDto } from '../../dto/confirm-totp.dto';
import { AuthGuard } from '@nestjs/passport';
import { SecurityService } from '../../../security/application/services/security.service';
import { SecurityEventType } from '../../../security/data/entities/security-event.entity';

@Controller('mfa')
export class MfaController {
  constructor(private readonly mfa: MfaService, private readonly security: SecurityService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('methods')
  async list(@Req() req: any) {
    return this.mfa.listMethodsForUser(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('totp/enroll')
  async enrollTotp(@Req() req: any) {
    const result = await this.mfa.enrollTotpForUser({ id: req.user.id, email: req.user.email });
    await this.security.recordEvent({
      type: SecurityEventType.MFA_ENROLL,
      userId: req.user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
      success: true,
      metadata: { method: 'totp', methodId: result.methodId },
    });
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('totp/confirm')
  async confirmTotp(@Req() req: any, @Body() dto: ConfirmTotpDto) {
    const ok = await this.mfa.confirmTotpEnrollment(req.user.id, dto.methodId, dto.code);
    await this.security.recordEvent({
      type: SecurityEventType.MFA_ENROLL,
      userId: req.user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
      success: ok,
      metadata: { method: 'totp', action: 'confirm', methodId: dto.methodId },
    });
    return { ok };
  }

  // Intentionally removed legacy/demo endpoints that accepted `userId` directly.
  // Keep only authenticated endpoints (JWT) to avoid insecure flows.
}
