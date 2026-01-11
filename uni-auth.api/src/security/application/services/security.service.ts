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
    // Simple rule: check AccessPolicy entries; if any policy requires MFA on new IP, return true.
    const policies = await this.accessPolicyRepo.find();
    // naive check — in real system, determine if IP is new for the user
    for (const p of policies) {
      if (p.requireMfaAlways) return true;
      if (p.requireMfaOnNewIp) {
        // TODO: check whether ip is new for user
        return true;
      }
    }
    return false;
  }

  validatePasswordAgainstPolicy(password: string, policy?: PasswordPolicyEntity): boolean {
    const p = policy || (this.passwordPolicyRepo.findOneBy({}) as unknown as PasswordPolicyEntity);
    if (!p) return true;
    if (password.length < p.minLength) return false;
    if (p.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (p.requireNumbers && !/[0-9]/.test(password)) return false;
    if (p.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }

  async listEvents(limit = 100) {
    return this.eventsRepo.find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
