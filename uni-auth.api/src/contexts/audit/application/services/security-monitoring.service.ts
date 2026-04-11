import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEventCategory } from '../../domain/entities/security-event-category.enum';
import { SecurityEventOrmEntity } from '../../infrastructure/persistence/security-event.orm-entity';
import {
  SecurityAlertEmailService,
  SecurityAlertPayload,
} from './security-alert-email.service';

export interface SecurityRequestContext {
  method: string;
  path: string;
  fullUrl: string;
  ipAddress: string;
  userAgent: string;
  userId: string | null;
  query: unknown;
  body: unknown;
  headers: unknown;
  requestId: string | null;
}

export interface SecurityDecision {
  category: SecurityEventCategory;
  reasons: string[];
  shouldBlock: boolean;
}

export interface SecurityPostAnalysis {
  category: SecurityEventCategory;
  reasons: string[];
}

export interface PersistSecurityEventInput {
  category: SecurityEventCategory;
  eventType: string;
  method: string;
  path: string;
  query: unknown;
  requestHeaders: unknown;
  requestBody: unknown;
  responseStatus: number;
  responseBody: unknown;
  durationMs: number;
  ipAddress: string;
  userAgent: string;
  userId: string | null;
  reasons: string[];
  requestId: string | null;
}

export interface SecurityEventsFilter {
  category?: SecurityEventCategory;
  search?: string;
  limit: number;
  offset: number;
  from?: Date;
  to?: Date;
  excludeUserId?: string;
  excludePathPrefix?: string;
}

export interface SecurityEventView {
  id: string;
  createdAt: string;
  category: SecurityEventCategory;
  eventType: string;
  method: string;
  path: string;
  responseStatus: number;
  durationMs: number;
  ipAddress: string;
  userAgent: string | null;
  userId: string | null;
  reasons: string[];
  requestId: string | null;
  query: unknown;
  requestHeaders: unknown;
  requestBody: unknown;
  responseBody: unknown;
}

export interface SecurityEventsPage {
  items: SecurityEventView[];
  total: number;
  limit: number;
  offset: number;
}

export interface SecuritySummary {
  periodHours: number;
  totalEvents: number;
  normalEvents: number;
  suspiciousEvents: number;
  preventedEvents: number;
  uniqueIpAddresses: number;
  alertedEvents: number;
  topReasons: Array<{ reason: string; count: number }>;
}

@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger(SecurityMonitoringService.name);

  private readonly preventIntrusions: boolean;
  private readonly blockOnSignature: boolean;
  private readonly authFailureWindowMs: number;
  private readonly authFailureSuspiciousThreshold: number;
  private readonly authFailureBlockThreshold: number;
  private readonly authBlockDurationMs: number;
  private readonly maxSerializedLength: number;
  private readonly alertCooldownMs: number;

  private readonly authFailuresByIp = new Map<string, number[]>();
  private readonly blockedIps = new Map<string, number>();
  private readonly alertCooldownByKey = new Map<string, number>();

  private readonly suspiciousPatterns: Array<{
    reason: string;
    regex: RegExp;
  }> = [
    {
      reason: 'Possible SQL injection signature detected',
      regex:
        /(\bunion\b\s+\bselect\b|\bselect\b.+\bfrom\b|\bor\b\s+1=1|sleep\s*\(|benchmark\s*\(|drop\s+table|insert\s+into|delete\s+from)/i,
    },
    {
      reason: 'Possible XSS signature detected',
      regex:
        /(<\s*script\b|javascript:|onerror\s*=|onload\s*=|<\s*img\b[^>]*onerror)/i,
    },
    {
      reason: 'Possible path traversal signature detected',
      regex: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i,
    },
    {
      reason: 'Possible command injection signature detected',
      regex: /(\|\||&&|;\s*(cat|ls|pwd|whoami|curl|wget)\b|\$\(|`.+`)/i,
    },
  ];

  constructor(
    @InjectRepository(SecurityEventOrmEntity)
    private readonly securityEventRepository: Repository<SecurityEventOrmEntity>,
    private readonly configService: ConfigService,
    private readonly securityAlertEmailService: SecurityAlertEmailService,
  ) {
    this.preventIntrusions = this.readBoolean(
      'SECURITY_MONITOR_PREVENT_INTRUSIONS',
      true,
    );
    this.blockOnSignature = this.readBoolean(
      'SECURITY_MONITOR_BLOCK_ON_SIGNATURE',
      true,
    );
    this.authFailureWindowMs =
      this.readNumber('SECURITY_MONITOR_AUTH_FAILURE_WINDOW_SECONDS', 600) *
      1000;
    this.authFailureSuspiciousThreshold = this.readNumber(
      'SECURITY_MONITOR_AUTH_FAILURE_SUSPICIOUS_THRESHOLD',
      5,
    );
    this.authFailureBlockThreshold = this.readNumber(
      'SECURITY_MONITOR_AUTH_FAILURE_BLOCK_THRESHOLD',
      8,
    );
    this.authBlockDurationMs =
      this.readNumber('SECURITY_MONITOR_AUTH_BLOCK_MINUTES', 30) * 60 * 1000;
    this.maxSerializedLength = this.readNumber(
      'SECURITY_MONITOR_MAX_SERIALIZED_LENGTH',
      12000,
    );
    this.alertCooldownMs =
      this.readNumber('SECURITY_MONITOR_ALERT_COOLDOWN_SECONDS', 120) * 1000;
  }

  analyzeIncomingRequest(context: SecurityRequestContext): SecurityDecision {
    this.cleanExpiredBlocks();

    const reasons: string[] = [];
    const isBlockedIp = this.isIpBlocked(context.ipAddress);

    if (isBlockedIp) {
      reasons.push(
        'IP is temporarily blocked after repeated failed authentication attempts',
      );
    }

    const detectorSource = [
      context.path,
      this.safeStringify(context.query),
      this.safeStringify(context.body),
      context.userAgent,
    ].join(' ');

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.regex.test(detectorSource)) {
        reasons.push(pattern.reason);
      }
    }

    if (/(sqlmap|nikto|acunetix|nessus|burp|nmap)/i.test(context.userAgent)) {
      reasons.push('Automated scanner User-Agent detected');
    }

    const hasSuspicion = reasons.length > 0;
    const shouldBlock =
      this.preventIntrusions &&
      (isBlockedIp || (this.blockOnSignature && hasSuspicion));

    return {
      category: shouldBlock
        ? SecurityEventCategory.PREVENTED
        : hasSuspicion
          ? SecurityEventCategory.SUSPICIOUS
          : SecurityEventCategory.NORMAL,
      reasons,
      shouldBlock,
    };
  }

  analyzeAfterResponse(
    path: string,
    ipAddress: string,
    responseStatus: number,
  ): SecurityPostAnalysis {
    if (!this.isAuthPath(path)) {
      return {
        category: SecurityEventCategory.NORMAL,
        reasons: [],
      };
    }

    if (responseStatus >= 200 && responseStatus < 400) {
      this.authFailuresByIp.delete(ipAddress);
      return {
        category: SecurityEventCategory.NORMAL,
        reasons: [],
      };
    }

    if (responseStatus !== 401 && responseStatus !== 403) {
      return {
        category: SecurityEventCategory.NORMAL,
        reasons: [],
      };
    }

    const now = Date.now();
    const recentAttempts = (this.authFailuresByIp.get(ipAddress) ?? []).filter(
      (timestamp) => now - timestamp <= this.authFailureWindowMs,
    );
    recentAttempts.push(now);
    this.authFailuresByIp.set(ipAddress, recentAttempts);

    const reasons: string[] = [];

    if (recentAttempts.length >= this.authFailureSuspiciousThreshold) {
      reasons.push(
        `Brute-force pattern: ${recentAttempts.length} failed auth attempts within ${Math.round(this.authFailureWindowMs / 60000)} minutes`,
      );
    }

    if (recentAttempts.length >= this.authFailureBlockThreshold) {
      this.blockedIps.set(ipAddress, now + this.authBlockDurationMs);
      reasons.push(
        `IP temporary block activated for ${Math.round(this.authBlockDurationMs / 60000)} minutes`,
      );
    }

    if (!reasons.length) {
      return {
        category: SecurityEventCategory.NORMAL,
        reasons: [],
      };
    }

    return {
      category: SecurityEventCategory.SUSPICIOUS,
      reasons,
    };
  }

  async persistEvent(input: PersistSecurityEventInput): Promise<void> {
    const queryString = this.safeStringify(input.query);
    const requestHeaders = this.safeStringify(input.requestHeaders);
    const requestBody = this.safeStringify(input.requestBody);
    const responseBody = this.safeStringify(input.responseBody);
    const reasonCodes = this.safeStringify(input.reasons);

    await this.securityEventRepository.save({
      category: input.category,
      eventType: input.eventType,
      method: input.method,
      path: input.path,
      queryString,
      requestHeaders,
      requestBody,
      responseStatus: input.responseStatus,
      responseBody,
      durationMs: input.durationMs,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent || null,
      userId: input.userId,
      reasonCodes,
      requestId: input.requestId,
    });

    if (input.category !== SecurityEventCategory.NORMAL) {
      const alertKey = this.buildAlertKey(input);
      if (this.shouldSendAlert(alertKey)) {
        void this.sendAlertEmail(input);
      }
    }
  }

  async getEvents(filter: SecurityEventsFilter): Promise<SecurityEventsPage> {
    const queryBuilder = this.securityEventRepository
      .createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC')
      .take(filter.limit)
      .skip(filter.offset);

    if (filter.category) {
      queryBuilder.andWhere('event.category = :category', {
        category: filter.category,
      });
    }

    if (filter.from) {
      queryBuilder.andWhere('event.createdAt >= :from', { from: filter.from });
    }

    if (filter.to) {
      queryBuilder.andWhere('event.createdAt <= :to', { to: filter.to });
    }

    if (filter.search?.trim()) {
      const search = `%${filter.search.trim()}%`;
      queryBuilder.andWhere(
        '(event.path ILIKE :search OR event.ipAddress ILIKE :search OR event.userId ILIKE :search OR event.reasonCodes ILIKE :search)',
        { search },
      );
    }

    if (filter.excludeUserId?.trim()) {
      queryBuilder.andWhere(
        '(event.userId IS NULL OR event.userId <> :excludeUserId)',
        {
          excludeUserId: filter.excludeUserId.trim(),
        },
      );
    }

    if (filter.excludePathPrefix?.trim()) {
      queryBuilder.andWhere('event.path NOT ILIKE :excludePathPrefix', {
        excludePathPrefix: `${filter.excludePathPrefix.trim()}%`,
      });
    }

    const [rows, total] = await queryBuilder.getManyAndCount();

    return {
      items: rows.map((row) => this.toView(row)),
      total,
      limit: filter.limit,
      offset: filter.offset,
    };
  }

  async getSummary(periodHours: number): Promise<SecuritySummary> {
    const now = Date.now();
    const since = new Date(now - periodHours * 3600 * 1000);

    const rawCategoryCounts = await this.securityEventRepository
      .createQueryBuilder('event')
      .select('event.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt >= :since', { since })
      .groupBy('event.category')
      .getRawMany<{ category: SecurityEventCategory; count: string }>();

    const uniqueIpRaw = await this.securityEventRepository
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.ipAddress)', 'count')
      .where('event.createdAt >= :since', { since })
      .getRawOne<{ count: string }>();

    const totalEvents = rawCategoryCounts.reduce(
      (acc, row) => acc + Number(row.count),
      0,
    );

    const getCount = (category: SecurityEventCategory): number =>
      Number(
        rawCategoryCounts.find((row) => row.category === category)?.count ?? 0,
      );

    const alertedEvents =
      getCount(SecurityEventCategory.SUSPICIOUS) +
      getCount(SecurityEventCategory.PREVENTED);

    const reasonRows = await this.securityEventRepository
      .createQueryBuilder('event')
      .where('event.createdAt >= :since', { since })
      .andWhere('event.reasonCodes IS NOT NULL')
      .orderBy('event.createdAt', 'DESC')
      .take(500)
      .getMany();

    const reasonCounter = new Map<string, number>();
    for (const row of reasonRows) {
      const reasons = this.parseReasons(row.reasonCodes);
      for (const reason of reasons) {
        reasonCounter.set(reason, (reasonCounter.get(reason) ?? 0) + 1);
      }
    }

    const topReasons = [...reasonCounter.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([reason, count]) => ({ reason, count }));

    return {
      periodHours,
      totalEvents,
      normalEvents: getCount(SecurityEventCategory.NORMAL),
      suspiciousEvents: getCount(SecurityEventCategory.SUSPICIOUS),
      preventedEvents: getCount(SecurityEventCategory.PREVENTED),
      uniqueIpAddresses: Number(uniqueIpRaw?.count ?? 0),
      alertedEvents,
      topReasons,
    };
  }

  toCsv(events: SecurityEventView[]): string {
    const headers = [
      'createdAt',
      'category',
      'eventType',
      'method',
      'path',
      'responseStatus',
      'durationMs',
      'ipAddress',
      'userId',
      'userAgent',
      'requestId',
      'reasons',
      'query',
      'requestHeaders',
      'requestBody',
      'responseBody',
    ];

    const rows = events.map((event) =>
      [
        event.createdAt,
        event.category,
        event.eventType,
        event.method,
        event.path,
        event.responseStatus,
        event.durationMs,
        event.ipAddress,
        event.userId ?? '',
        event.userAgent ?? '',
        event.requestId ?? '',
        event.reasons.join('; '),
        event.query,
        event.requestHeaders,
        event.requestBody,
        event.responseBody,
      ]
        .map((value) => this.csvEscape(value))
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  resolveHttpStatus(error: unknown, fallbackStatus: number): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (fallbackStatus && fallbackStatus > 0) {
      return fallbackStatus;
    }

    return 500;
  }

  extractErrorPayload(error: unknown): unknown {
    if (error instanceof HttpException) {
      return error.getResponse();
    }

    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }

    return {
      message: 'Unknown error',
    };
  }

  mergeDecisions(
    before: SecurityDecision,
    after: SecurityPostAnalysis,
  ): SecurityDecision {
    const reasons = [...before.reasons, ...after.reasons];

    const category = this.maxCategory(before.category, after.category);

    return {
      category,
      reasons,
      shouldBlock: before.shouldBlock,
    };
  }

  private async sendAlertEmail(
    input: PersistSecurityEventInput,
  ): Promise<void> {
    try {
      const payload: SecurityAlertPayload = {
        category: input.category,
        eventType: input.eventType,
        method: input.method,
        path: input.path,
        ipAddress: input.ipAddress,
        userId: input.userId,
        responseStatus: input.responseStatus,
        reasons: input.reasons,
        requestId: input.requestId,
        timestamp: new Date().toISOString(),
      };

      await this.securityAlertEmailService.sendAlert(payload);
    } catch (error) {
      this.logger.error(
        `Failed to send security alert email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private buildAlertKey(input: PersistSecurityEventInput): string {
    return [
      input.category,
      input.ipAddress,
      input.path,
      input.reasons[0] ?? '-',
    ].join('|');
  }

  private shouldSendAlert(key: string): boolean {
    const now = Date.now();
    const blockedUntil = this.alertCooldownByKey.get(key);
    if (blockedUntil && blockedUntil > now) {
      return false;
    }

    this.alertCooldownByKey.set(key, now + this.alertCooldownMs);
    return true;
  }

  private maxCategory(
    left: SecurityEventCategory,
    right: SecurityEventCategory,
  ): SecurityEventCategory {
    const weight = (value: SecurityEventCategory): number => {
      if (value === SecurityEventCategory.PREVENTED) {
        return 3;
      }
      if (value === SecurityEventCategory.SUSPICIOUS) {
        return 2;
      }
      return 1;
    };

    return weight(left) >= weight(right) ? left : right;
  }

  private toView(row: SecurityEventOrmEntity): SecurityEventView {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      category: row.category,
      eventType: row.eventType,
      method: row.method,
      path: row.path,
      responseStatus: row.responseStatus,
      durationMs: row.durationMs,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      userId: row.userId,
      reasons: this.parseReasons(row.reasonCodes),
      requestId: row.requestId,
      query: this.safeParse(row.queryString),
      requestHeaders: this.safeParse(row.requestHeaders),
      requestBody: this.safeParse(row.requestBody),
      responseBody: this.safeParse(row.responseBody),
    };
  }

  private parseReasons(serializedReasons: string | null): string[] {
    const parsed = this.safeParse(serializedReasons);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }

    if (typeof parsed === 'string' && parsed.trim()) {
      return [parsed];
    }

    return [];
  }

  private safeStringify(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const sanitized = this.sanitize(value);
    try {
      const serialized =
        typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
      if (serialized.length <= this.maxSerializedLength) {
        return serialized;
      }

      return `${serialized.slice(0, this.maxSerializedLength)}...<truncated>`;
    } catch {
      const fallback = String(sanitized);
      if (fallback.length <= this.maxSerializedLength) {
        return fallback;
      }

      return `${fallback.slice(0, this.maxSerializedLength)}...<truncated>`;
    }
  }

  private sanitize(value: unknown, depth = 0): unknown {
    if (depth > 5) {
      return '[max-depth-reached]';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 50).map((item) => this.sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, entryValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (this.isSensitiveKey(key)) {
          result[key] = '[redacted]';
          continue;
        }

        result[key] = this.sanitize(entryValue, depth + 1);
      }
      return result;
    }

    return String(value);
  }

  private isSensitiveKey(key: string): boolean {
    return /(password|pass|token|authorization|secret|mfa|code)/i.test(key);
  }

  private safeParse(serialized: string | null): unknown {
    if (!serialized) {
      return null;
    }

    try {
      return JSON.parse(serialized);
    } catch {
      return serialized;
    }
  }

  private isAuthPath(path: string): boolean {
    return (
      path.includes('/security/login/initiate') ||
      path.includes('/security/login/verify-mfa') ||
      path.includes('/security/authenticator/login') ||
      path.includes('/security/authenticator/verify-email') ||
      path.includes('/security-monitoring/officer/login')
    );
  }

  private isIpBlocked(ipAddress: string): boolean {
    const blockedUntil = this.blockedIps.get(ipAddress);
    if (!blockedUntil) {
      return false;
    }

    return blockedUntil > Date.now();
  }

  private cleanExpiredBlocks(): void {
    const now = Date.now();

    for (const [ipAddress, blockedUntil] of this.blockedIps.entries()) {
      if (blockedUntil <= now) {
        this.blockedIps.delete(ipAddress);
      }
    }

    for (const [key, blockedUntil] of this.alertCooldownByKey.entries()) {
      if (blockedUntil <= now) {
        this.alertCooldownByKey.delete(key);
      }
    }

    for (const [ipAddress, timestamps] of this.authFailuresByIp.entries()) {
      const filtered = timestamps.filter(
        (timestamp) => now - timestamp <= this.authFailureWindowMs,
      );
      if (!filtered.length) {
        this.authFailuresByIp.delete(ipAddress);
        continue;
      }

      this.authFailuresByIp.set(ipAddress, filtered);
    }
  }

  private readBoolean(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (!value) {
      return fallback;
    }

    return value.toLowerCase() === 'true';
  }

  private readNumber(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }

    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      return fallback;
    }

    return parsed;
  }

  private csvEscape(value: unknown): string {
    if (value === null || value === undefined) {
      return '""';
    }

    const rawValue =
      typeof value === 'string'
        ? value
        : (() => {
            try {
              return JSON.stringify(value);
            } catch {
              return String(value);
            }
          })();

    const normalized = rawValue.replace(/\r?\n/g, ' ');
    return `"${normalized.replace(/"/g, '""')}"`;
  }
}
