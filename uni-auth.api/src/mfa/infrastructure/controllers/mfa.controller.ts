import { Controller, Post, Body, Param, Get, UseGuards, Req } from '@nestjs/common';
import { MfaService } from '../../application/services/mfa.service';
import { EnableTotpDto } from '../../dto/enable-totp.dto';
import { InitiateSmsDto } from '../../dto/initiate-sms.dto';
import { VerifyChallengeDto } from '../../dto/verify-challenge.dto';
import { VerifyTotpDto } from '../../dto/verify-totp.dto';
import { ConfirmTotpDto } from '../../dto/confirm-totp.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('mfa')
export class MfaController {
  constructor(private readonly mfa: MfaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('methods')
  async list(@Req() req: any) {
    return this.mfa.listMethodsForUser(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('totp/enroll')
  async enrollTotp(@Req() req: any) {
    return this.mfa.enrollTotpForUser({ id: req.user.id, email: req.user.email });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('totp/confirm')
  async confirmTotp(@Req() req: any, @Body() dto: ConfirmTotpDto) {
    return { ok: await this.mfa.confirmTotpEnrollment(req.user.id, dto.methodId, dto.code) };
  }

  @Post('totp/enable')
  async enableTotp(@Body() dto: EnableTotpDto) {
    // in real app, resolve user from DB (use IdentityService)
    const user = { id: dto.userId } as any;
    return this.mfa.enableTOTPForUser(user);
  }

  @Post('totp/verify')
  async verifyTotp(@Body() dto: VerifyTotpDto) {
    return { ok: await this.mfa.verifyTOTP(dto.methodId, dto.code) };
  }

  @Post('sms/initiate')
  async initiateSms(@Body() dto: InitiateSmsDto) {
    const user = { id: dto.userId } as any;
    return this.mfa.initiateSMSChallenge(user, dto.phone);
  }

  @Post('challenge/:id/verify')
  async verify(@Param('id') id: string, @Body() dto: VerifyChallengeDto) {
    return { ok: await this.mfa.verifyChallenge(id, dto.code) };
  }
}
