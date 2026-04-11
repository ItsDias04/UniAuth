import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { SecurityEventCategory } from '../domain/entities/security-event-category.enum';
import {
  SecurityEventsQueryDto,
  SecurityOfficerLoginDto,
  SecuritySummaryQueryDto,
} from './dto/security-monitoring.dto';
import {
  SecurityEventsFilter,
  SecurityMonitoringService,
} from '../application/services/security-monitoring.service';
import { SecurityOfficerAuthService } from '../application/services/security-officer-auth.service';
import {
  SecurityOfficerGuard,
  SecurityOfficerRequest,
} from './guards/security-officer.guard';
import { Response } from 'express';

@ApiTags('Security Monitoring')
@Controller('security-monitoring')
export class SecurityMonitoringController {
  constructor(
    private readonly securityMonitoringService: SecurityMonitoringService,
    private readonly securityOfficerAuthService: SecurityOfficerAuthService,
  ) {}

  @Public()
  @Post('officer/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Dedicated security officer login. This account is isolated from regular IAM login.',
  })
  @ApiBody({ type: SecurityOfficerLoginDto })
  @ApiOkResponse({
    description: 'Returns dedicated security monitoring access token',
  })
  async loginOfficer(@Body() dto: SecurityOfficerLoginDto) {
    return this.securityOfficerAuthService.login(dto.login, dto.password);
  }

  @Public()
  @Get('officer/session')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate security officer session token' })
  @ApiOkResponse({ description: 'Security officer session is valid' })
  async officerSession(@Req() request: SecurityOfficerRequest) {
    return {
      status: 'OK',
      login: request.securityOfficer?.login,
      role: request.securityOfficer?.role,
      permissions: request.securityOfficer?.permissions ?? [],
    };
  }

  @Public()
  @Get('events')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all security monitoring events' })
  @ApiOkResponse({ description: 'Security events page' })
  async getEvents(
    @Query() query: SecurityEventsQueryDto,
    @Req() request: SecurityOfficerRequest,
  ) {
    return this.securityMonitoringService.getEvents(
      this.toFilter(query, request),
    );
  }

  @Public()
  @Get('events/suspicious')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get only suspicious events' })
  @ApiOkResponse({ description: 'Suspicious security events page' })
  async getSuspiciousEvents(
    @Query() query: SecurityEventsQueryDto,
    @Req() request: SecurityOfficerRequest,
  ) {
    return this.securityMonitoringService.getEvents({
      ...this.toFilter(query, request),
      category: SecurityEventCategory.SUSPICIOUS,
    });
  }

  @Public()
  @Get('events/prevented')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get only prevented actions' })
  @ApiOkResponse({ description: 'Prevented security events page' })
  async getPreventedEvents(
    @Query() query: SecurityEventsQueryDto,
    @Req() request: SecurityOfficerRequest,
  ) {
    return this.securityMonitoringService.getEvents({
      ...this.toFilter(query, request),
      category: SecurityEventCategory.PREVENTED,
    });
  }

  @Public()
  @Get('events/export')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download filtered security logs as CSV' })
  @ApiOkResponse({ description: 'CSV payload with selected security events' })
  async exportEvents(
    @Query() query: SecurityEventsQueryDto,
    @Req() request: SecurityOfficerRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const filter = this.toFilter(query, request, {
      limit: 5000,
      offset: 0,
    });
    const page = await this.securityMonitoringService.getEvents(filter);
    const csv = this.securityMonitoringService.toCsv(page.items);

    const categoryPart = filter.category ?? 'all';
    const filename = `security-events-${categoryPart}-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.csv`;

    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );

    return `\uFEFF${csv}`;
  }

  @Public()
  @Get('summary')
  @UseGuards(SecurityOfficerGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get security dashboard summary' })
  @ApiOkResponse({ description: 'Aggregated summary for requested period' })
  async getSummary(@Query() query: SecuritySummaryQueryDto) {
    return this.securityMonitoringService.getSummary(query.hours);
  }

  private toFilter(
    query: SecurityEventsQueryDto,
    request: SecurityOfficerRequest,
    overrides?: Partial<Pick<SecurityEventsFilter, 'limit' | 'offset'>>,
  ): SecurityEventsFilter {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const shouldExcludeOfficer = query.excludeCurrentOfficer !== false;
    const currentOfficerId = request.securityOfficer?.sub;

    return {
      category: query.category,
      search: query.search,
      limit: overrides?.limit ?? query.limit,
      offset: overrides?.offset ?? query.offset,
      from,
      to,
      excludeUserId:
        shouldExcludeOfficer && currentOfficerId ? currentOfficerId : undefined,
      excludePathPrefix: shouldExcludeOfficer
        ? '/api/v1/security-monitoring'
        : undefined,
    };
  }
}
