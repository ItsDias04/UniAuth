import {
  Controller,
  Get,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../domain/repositories/audit-log.repository.interface';
import { AuditAction } from '../domain/entities/audit-log-entry.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditRepo: IAuditLogRepository,
  ) {}

  /**
   * GET /audit?page=1&limit=50 — Последние записи аудита.
   */
  @Get()
  async getRecentLogs(
    @Query('limit') limit: number = 50,
  ) {
    const entries = await this.auditRepo.findRecent(Math.min(limit, 200));
    return entries.map((e) => ({
      id: e.id,
      action: e.action,
      severity: e.severity,
      userId: e.userId,
      ip: e.ip,
      details: e.details,
      timestamp: e.timestamp.toISOString(),
    }));
  }

  /**
   * GET /audit/user/:userId?page=1&limit=20 — Аудит по пользователю.
   */
  @Get('user/:userId')
  async getUserLogs(
    @Query('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditRepo.findByUserId(userId, page, limit);
  }

  /**
   * GET /audit/action/:action?page=1&limit=20 — Аудит по типу действия.
   */
  @Get('action/:action')
  async getActionLogs(
    @Query('action') action: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.auditRepo.findByAction(action as AuditAction, page, limit);
  }
}
