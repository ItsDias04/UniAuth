import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEventEntity, SecurityEventType } from '../../data/entities/security-event.entity';
import { PasswordPolicyEntity } from '../../data/entities/password-policy.entity';
import { AccessPolicyEntity } from '../../data/entities/access-policy.entity';
import { RiskScore } from '../../value-objects/risk-score.vo';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(SecurityEventEntity)
    private readonly eventsRepo: Repository<SecurityEventEntity>,
    @InjectRepository(PasswordPolicyEntity)
    private readonly passwordPolicyRepo: Repository<PasswordPolicyEntity>,
    @InjectRepository(AccessPolicyEntity)
    private readonly accessPolicyRepo: Repository<AccessPolicyEntity>,
  ) {}

  async recordEvent(payload: Partial<SecurityEventEntity>) {
    const ev = this.eventsRepo.create(payload as SecurityEventEntity);
    return this.eventsRepo.save(ev);
  }

  async evaluateRisk(params: { ip?: string; userAgent?: string; userId?: string }): Promise<RiskScore> {
    // Placeholder: do lookups (IP reputation, geo, velocity) and compute risk.
    // For now return low risk for localhost, otherwise a simple heuristic.
    const ip = params.ip || '';
    let ipRep = 20;
    if (!ip || ip.startsWith('127.') || ip === '::1') ipRep = 0;
    const geoMismatch = 0; // TODO: integrate geo lookups
    const velocity = 10; // TODO: track recent attempts
    const score = RiskScore.fromFactors(ipRep, geoMismatch, velocity);
    this.logger.debug(`Calculated risk ${score.toNumber()} for ip=${ip}`);
    return score;
  }

  async isMfaRequiredForLogin(userId: string, ip?: string): Promise<boolean> {
    const policies = await this.accessPolicyRepo.find();
    if (policies.some((p) => p.requireMfaAlways)) return true;

    const newIpPolicyEnabled = policies.some((p) => p.requireMfaOnNewIp);
    if (!newIpPolicyEnabled) return false;
    if (!ip) return true;

    const lastSuccess = await this.eventsRepo.findOne({
      where: { type: SecurityEventType.LOGIN, userId, success: true },
      order: { createdAt: 'DESC' },
    });

    if (!lastSuccess?.ipAddress) return true;
    return lastSuccess.ipAddress !== ip;
  }

  validatePasswordAgainstPolicy(password: string, policy?: PasswordPolicyEntity | null): boolean {
    if (!policy) return true;
    if (password.length < policy.minLength) return false;
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (policy.requireNumbers && !/[0-9]/.test(password)) return false;
    if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }

  async getActivePasswordPolicy(): Promise<PasswordPolicyEntity | null> {
    // Simplest model: the newest policy is active.
    return this.passwordPolicyRepo.findOne({ order: { createdAt: 'DESC' } as any });
  }

  async validatePasswordAgainstActivePolicy(password: string): Promise<boolean> {
    const policy = await this.getActivePasswordPolicy();
    return this.validatePasswordAgainstPolicy(password, policy);
  }

  async listEvents(limit = 100) {
    return this.eventsRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
