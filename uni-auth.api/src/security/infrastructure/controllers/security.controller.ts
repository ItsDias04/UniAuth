import { Controller, Post, Body, Get, Query, HttpCode } from '@nestjs/common';
import { SecurityService } from '../../application/services/security.service';

@Controller('security')
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Post('events')
  @HttpCode(201)
  async recordEvent(@Body() body: any) {
    // body should contain: type, userId, ipAddress, userAgent, metadata, success
    return this.security.recordEvent(body);
  }

  @Get('audit')
  async listAudit(@Query('limit') limit = '100') {
    const n = parseInt(limit, 10) || 100;
    return this.security.listEvents(n);
  }
}
