import { Controller, Post, Body, Req, UseGuards, Get, Param } from '@nestjs/common';
import { TokenService } from '../../application/services/token.service';
import { IdentityService } from '../../../identity/application/services/identity.service/identity.service';
import { AuthGuard } from '@nestjs/passport';

class RefreshDto {
  refreshToken: string;
}

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokenSvc: TokenService, private readonly identity: IdentityService) {}

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    const res = await this.tokenSvc.rotateRefreshToken(dto.refreshToken);
    if (!res) return { error: 'invalid_grant' };
    return res;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  async sessions(@Req() req: any) {
    const user = await this.identity.findById(req.user.id);
    if (!user) return { sessions: [] };
    return this.tokenSvc.listSessions(user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('revoke/:id')
  async revoke(@Param('id') id: string) {
    const ok = await this.tokenSvc.revokeRefreshToken(id);
    return { revoked: ok };
  }
}
