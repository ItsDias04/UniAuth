import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  ISessionRepository,
  SESSION_REPOSITORY,
} from '../domain/repositories/session.repository.interface';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: ISessionRepository,
  ) {}

  /**
   * GET /sessions — Все активные сессии текущего пользователя.
   */
  @Get()
  async getActiveSessions(@CurrentUser('sub') userId: string) {
    const sessions = await this.sessionRepo.findActiveByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      deviceFingerprint: s.deviceFingerprint,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  /**
   * DELETE /sessions/:id — Отзыв конкретной сессии.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const session = await this.sessionRepo.findById(sessionId);
    if (session && session.userId === userId) {
      session.revoke();
      await this.sessionRepo.save(session);
    }
  }

  /**
   * POST /sessions/revoke-all — Отзыв всех сессий (logout everywhere).
   */
  @Post('revoke-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(@CurrentUser('sub') userId: string) {
    await this.sessionRepo.revokeAllByUserId(userId);
  }
}
