import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthorizationCode } from '../../data/entities/authorization-code.entity';
import { AuthorizationRequest } from '../../data/entities/authorization-request.entity';
import { IdentityService } from '../../../identity/application/services/identity.service/identity.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { ClientsService } from '../../../clients/application/services/clients.service';

function base64UrlEncode(buffer: Buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

@Injectable()
export class OidcService {
  constructor(
    @InjectRepository(AuthorizationCode)
    private readonly codes: Repository<AuthorizationCode>,
    @InjectRepository(AuthorizationRequest)
    private readonly requests: Repository<AuthorizationRequest>,
    private readonly identity: IdentityService,
    private readonly jwt: JwtService,
    private readonly clients: ClientsService,
  ) {}

  async createAuthorizationRequest(params: {
    clientId: string | null;
    redirectUri: string | null;
    scope?: string;
    state?: string;
    nonce?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }) {
    const { clientId, redirectUri } = params;
    if (!clientId) throw new BadRequestException('client_id is required');
    if (!redirectUri) throw new BadRequestException('redirect_uri is required');

    const client = await this.clients.findByClientId(clientId);
    if (!client) throw new BadRequestException('unknown client_id');

    const allowed = (client.redirectUris || []).map((r: any) => r.uri || r);
    if (!allowed.includes(redirectUri)) throw new BadRequestException('redirect_uri not registered for client');

    const req = new AuthorizationRequest();
    req.clientId = clientId;
    req.redirectUri = redirectUri;
    req.scope = params.scope ?? null;
    req.state = params.state ?? null;
    req.nonce = params.nonce ?? null;
    req.codeChallenge = params.codeChallenge ?? null;
    req.codeChallengeMethod = params.codeChallengeMethod ?? null;
    req.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const saved = await this.requests.save(req);
    return saved;
  }

  async getAuthorizationRequest(id: string) {
    const req = await this.requests.findOne({ where: { id } });
    if (!req) throw new NotFoundException('authorization request not found');
    if (req.expiresAt < new Date()) throw new BadRequestException('authorization request expired');
    return req;
  }

  async createAuthorizationCode(userId: string, clientId: string | null, redirectUri: string | null, codeChallenge?: string, codeChallengeMethod?: string) {
    const code = base64UrlEncode(randomBytes(32));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const entity = new AuthorizationCode();
    entity.code = code;
    if (!clientId) throw new BadRequestException('client_id is required');
    const client = await this.clients.findByClientId(clientId);
    if (!client) throw new BadRequestException('unknown client_id');
    entity.clientId = clientId;
    if (!redirectUri) throw new BadRequestException('redirect_uri is required');
    // validate redirect URI against registered client
    const allowed = (client.redirectUris || []).map((r: any) => r.uri || r);
    if (!allowed.includes(redirectUri)) throw new BadRequestException('redirect_uri not registered for client');
    entity.redirectUri = redirectUri;
    entity.userId = userId;
    entity.codeChallenge = codeChallenge ?? null;
    entity.codeChallengeMethod = codeChallengeMethod ?? null;
    entity.expiresAt = expiresAt;
    await this.codes.save(entity);
    return code;
  }

  async exchangeCode(code: string, codeVerifier?: string, clientId?: string, redirectUri?: string) {
    const c = await this.codes.findOne({ where: { code } });
    if (!c) throw new NotFoundException('authorization code not found');
    if (c.expiresAt < new Date()) throw new BadRequestException('code expired');
    if (c.clientId && clientId && c.clientId !== clientId) throw new BadRequestException('client mismatch');
    if (c.redirectUri && redirectUri && c.redirectUri !== redirectUri) throw new BadRequestException('redirect_uri mismatch');

    // PKCE check
    if (c.codeChallenge) {
      if (!codeVerifier) throw new BadRequestException('code_verifier required');
      if (c.codeChallengeMethod === 'S256') {
        const hash = createHash('sha256').update(codeVerifier).digest();
        const expected = base64UrlEncode(hash);
        if (expected !== c.codeChallenge) throw new BadRequestException('PKCE verification failed');
      } else {
        // plain
        if (codeVerifier !== c.codeChallenge) throw new BadRequestException('PKCE verification failed');
      }
    }

    // Issue tokens
    const user = await this.identity.findById(c.userId);
    if (!user) throw new NotFoundException('user not found');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);
    const idToken = this.jwt.sign({ ...payload, iss: 'http://localhost:3000', aud: clientId || 'client' });

    // delete used code
    await this.codes.remove(c);

    return { access_token: accessToken, token_type: 'Bearer', expires_in: 3600, id_token: idToken };
  }
}
