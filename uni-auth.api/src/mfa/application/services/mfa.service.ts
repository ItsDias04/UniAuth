import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MFAMethod, MFAMethodType } from '../../data/entities/mfa-method.entity';
import { TOTPConfig } from '../../data/entities/totp-config.entity';
import { MFAChallenge } from '../../data/entities/mfa-challenge.entity';
import { User } from '../../../identity/data/entities/user.entity';
import { authenticator } from 'otplib';

@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(MFAMethod)
    private readonly methods: Repository<MFAMethod>,
    @InjectRepository(TOTPConfig)
    private readonly tots: Repository<TOTPConfig>,
    @InjectRepository(MFAChallenge)
    private readonly challenges: Repository<MFAChallenge>,
  ) {}

  async enrollTotpForUser(user: { id: string; email?: string }) {
    const method = new MFAMethod();
    method.user = { id: user.id } as any;
    method.type = MFAMethodType.TOTP;
    method.confirmed = false;
    const savedMethod = await this.methods.save(method);

    const secret = authenticator.generateSecret();
    const cfg = new TOTPConfig();
    cfg.method = savedMethod;
    cfg.secretSeed = secret;
    await this.tots.save(cfg);

    const issuer = 'UniAuth';
    const label = user.email ? `${issuer}:${user.email}` : `${issuer}:${user.id}`;
    const otpauthUri = authenticator.keyuri(label, issuer, secret);
    return { methodId: savedMethod.id, secret, otpauthUri };
  }

  async confirmTotpEnrollment(userId: string, methodId: string, token: string): Promise<boolean> {
    const cfg = await this.tots.findOne({ where: { method: { id: methodId } }, relations: ['method', 'method.user'] });
    if (!cfg) throw new NotFoundException('TOTP configuration not found');
    if (cfg.method.user.id !== userId) throw new NotFoundException('TOTP configuration not found');

    const ok = authenticator.check(token, cfg.secretSeed);
    if (!ok) return false;
    cfg.method.confirmed = true;
    await this.methods.save(cfg.method);
    return true;
  }

  async listMethodsForUser(userId: string) {
    return this.methods.find({ where: { user: { id: userId } as any } });
  }

  async verifyAnyConfirmedTotpForUser(userId: string, token: string): Promise<boolean> {
    const cfgs = await this.tots.find({ where: { method: { user: { id: userId } as any, type: MFAMethodType.TOTP, confirmed: true } as any } as any, relations: ['method', 'method.user'] });
    for (const cfg of cfgs) {
      if (authenticator.check(token, cfg.secretSeed)) return true;
    }
    return false;
  }

  async initiateSMSChallenge(user: User, phone: string, ttlSeconds = 300) {
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const ch = new MFAChallenge();
    ch.user = user;
    ch.code = code;
    ch.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    ch.attempts = 0;
    await this.challenges.save(ch);
    // TODO: integrate SMS provider to send `code` to `phone`
    return { challengeId: ch.id, expiresAt: ch.expiresAt };
  }

  async verifyChallenge(challengeId: string, code: string) {
    const ch = await this.challenges.findOne({ where: { id: challengeId }, relations: ['user'] });
    if (!ch) throw new NotFoundException('Challenge not found');
    if (ch.expiresAt < new Date()) return false;
    ch.attempts = ch.attempts + 1;
    await this.challenges.save(ch);
    return ch.code === code;
  }

  async verifyTOTP(methodId: string, token: string): Promise<boolean> {
    const cfg = await this.tots.findOne({ where: { method: { id: methodId } }, relations: ['method'] });
    if (!cfg) throw new NotFoundException('TOTP configuration not found');
    const secret = cfg.secretSeed;
    return authenticator.check(token, secret);
  }
}
