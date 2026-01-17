import { Controller, Get, Post, Body, Query, UseGuards, Req, Res, BadRequestException } from '@nestjs/common';
import { OidcService } from '../../application/services/oidc.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from '../../../identity/application/services/auth.service/auth.service';
import { MfaService } from '../../../mfa/application/services/mfa.service';
import { SecurityService } from '../../../security/application/services/security.service';
import { SecurityEventType } from '../../../security/data/entities/security-event.entity';

@Controller()
export class OidcController {
  constructor(
    private readonly oidc: OidcService,
    private readonly auth: AuthService,
    private readonly mfa: MfaService,
    private readonly security: SecurityService,
  ) {}

  @Get('.well-known/openid-configuration')
  wellKnown() {
    return {
      issuer: 'http://localhost:3000',
      authorization_endpoint: 'http://localhost:3000/oauth/authorize',
      token_endpoint: 'http://localhost:3000/oauth/token',
      userinfo_endpoint: 'http://localhost:3000/userinfo',
      jwks_uri: 'http://localhost:3000/.well-known/jwks.json',
    };
  }

  // Real-ish browser flow: validate request, then redirect to Angular login UI.
  @Get('oauth/authorize')
  async authorizeRedirect(
    @Query('response_type') responseType: string,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('scope') scope: string | undefined,
    @Query('state') state: string | undefined,
    @Query('nonce') nonce: string | undefined,
    @Query('code_challenge') codeChallenge: string | undefined,
    @Query('code_challenge_method') codeChallengeMethod: string | undefined,
    @Res() res: Response,
  ) {
    if (responseType !== 'code') throw new BadRequestException('only response_type=code is supported');

    const req = await this.oidc.createAuthorizationRequest({
      clientId,
      redirectUri,
      scope,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod,
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:4200';
    // Angular should implement a page that reads `requestId`, asks for login/password and, if needed, MFA.
    const url = `${frontend.replace(/\/$/, '')}/oidc/login?requestId=${encodeURIComponent(req.id)}`;
    return res.redirect(url);
  }

  // Called by Angular after user enters credentials (+ optional MFA code) to finalize and redirect back to client.
  @Post('oauth/authorize/complete')
  async complete(@Body() body: any, @Req() req: any) {
    const { requestId, email, password, totpCode } = body;
    if (!requestId) throw new BadRequestException('requestId is required');
    if (!email || !password) throw new BadRequestException('email and password are required');

    const authReq = await this.oidc.getAuthorizationRequest(requestId);

    const user = await this.auth.validateUser(email, password);
    if (!user) {
      await this.security.recordEvent({
        type: SecurityEventType.LOGIN_FAILED,
        userId: null,
        ipAddress: req.ip ?? null,
        userAgent: req.headers?.['user-agent'] ?? null,
        success: false,
        metadata: { flow: 'oidc', clientId: authReq.clientId },
      });
      return { error: 'access_denied' };
    }

    const risk = await this.security.evaluateRisk({ ip: req.ip, userAgent: req.headers?.['user-agent'], userId: user.id });
    const mfaRequiredByPolicy = await this.security.isMfaRequiredForLogin(user.id, req.ip);
    const mfaRequired = mfaRequiredByPolicy || risk.toNumber() >= 50;

    if (mfaRequired) {
      if (!totpCode) {
        return { mfa_required: true, required_factors: ['totp'], requestId };
      }
      const ok = await this.mfa.verifyAnyConfirmedTotpForUser(user.id, totpCode);
      if (!ok) {
        await this.security.recordEvent({
          type: SecurityEventType.LOGIN_FAILED,
          userId: user.id,
          ipAddress: req.ip ?? null,
          userAgent: req.headers?.['user-agent'] ?? null,
          success: false,
          metadata: { flow: 'oidc', reason: 'mfa_failed', clientId: authReq.clientId },
          riskScore: risk.toNumber(),
        });
        return { mfa_required: true, required_factors: ['totp'], requestId };
      }
    }

    await this.security.recordEvent({
      type: SecurityEventType.LOGIN,
      userId: user.id,
      ipAddress: req.ip ?? null,
      userAgent: req.headers?.['user-agent'] ?? null,
      success: true,
      metadata: { flow: 'oidc', clientId: authReq.clientId },
      riskScore: risk.toNumber(),
    });

    const code = await this.oidc.createAuthorizationCode(
      user.id,
      authReq.clientId,
      authReq.redirectUri,
      authReq.codeChallenge ?? undefined,
      authReq.codeChallengeMethod ?? undefined,
    );

    const redirect = new URL(authReq.redirectUri);
    redirect.searchParams.set('code', code);
    if (authReq.state) redirect.searchParams.set('state', authReq.state);
    return { redirect_to: redirect.toString() };
  }

  @Post('oauth/token')
  async token(@Body() body: any) {
    const { grant_type } = body;
    if (grant_type === 'authorization_code') {
      const { code, code_verifier, redirect_uri, client_id } = body;
      return this.oidc.exchangeCode(code, code_verifier, client_id, redirect_uri);
    }
    return { error: 'unsupported_grant_type' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('userinfo')
  async userinfo(@Req() req: any) {
    return { sub: req.user.id, email: req.user.email };
  }
}
