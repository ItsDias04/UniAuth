import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../data/entities/session.entity';
import { RefreshToken } from '../../data/entities/refresh-token.entity';
import { User } from '../../../identity/data/entities/user.entity';
import { randomBytes, pbkdf2Sync } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  issueAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwt.sign(payload);
    return token;
  }

  issueIdToken(user: User, clientId?: string) {
    const payload = { sub: user.id, email: user.email, iss: 'http://localhost:3000', aud: clientId || 'client' };
    return this.jwt.sign(payload);
  }

  async createSession(user: User, options: { userAgent?: string; ip?: string; ttlSeconds?: number } = {}) {
    const ttl = options.ttlSeconds ?? 60 * 60 * 24 * 7; // default 7 days
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const s = new Session();
    s.user = user;
    s.userAgent = options.userAgent ?? null;
    s.ipAddress = options.ip ?? null;
    s.expiresAt = expiresAt;
    s.active = true;
    return this.sessions.save(s);
  }

  async generateRefreshToken(user: User, session: Session, ttlSeconds = 60 * 60 * 24 * 30) {
    const token = randomBytes(48).toString('hex');
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(token, salt, 310000, 64, 'sha512').toString('hex');

    const rt = new RefreshToken();
    rt.user = user;
    rt.tokenHash = `${hash}.${salt}`;
    rt.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    rt.revoked = false;
    await this.refreshTokens.save(rt);
    return token; // raw token returned to client once
  }

  async rotateRefreshToken(oldToken: string) {
    // find by matching hash (not efficient for demo). In real app store salt separately and index.
    const all = await this.refreshTokens.find();
    for (const r of all) {
      const [hash, salt] = r.tokenHash.split('.');
      const candidate = pbkdf2Sync(oldToken, salt, 310000, 64, 'sha512').toString('hex');
      if (candidate === hash && !r.revoked && r.expiresAt > new Date()) {
        // revoke old
        r.revoked = true;
        await this.refreshTokens.save(r);
        // create new session or reuse
        const user = r.user as any as User;
        const session = await this.createSession(user, { ttlSeconds: 60 * 60 * 24 * 30 });
        const newToken = await this.generateRefreshToken(user, session);
        const accessToken = this.issueAccessToken(user);
        return { accessToken, refreshToken: newToken };
      }
    }
    return null;
  }

  async revokeRefreshToken(tokenId: string) {
    const rt = await this.refreshTokens.findOne({ where: { id: tokenId } });
    if (!rt) return false;
    rt.revoked = true;
    await this.refreshTokens.save(rt);
    return true;
  }

  async listSessions(userId: string) {
    return this.sessions.find({ where: { user: { id: userId } } });
  }
}
