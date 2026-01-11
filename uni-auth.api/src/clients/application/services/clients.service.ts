import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../../data/entities/client.entity';
import { RedirectUri } from '../../data/entities/redirect-uri.entity';
import { randomBytes, pbkdf2Sync } from 'crypto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(RedirectUri)
    private readonly uris: Repository<RedirectUri>,
  ) {}

  async registerClient(opts: {
    name?: string;
    redirectUris: string[];
    scopes?: string[];
    grantTypes?: string[];
  }) {
    const clientId = randomBytes(12).toString('hex');
    const clientSecret = randomBytes(32).toString('hex');
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(clientSecret, salt, 310000, 64, 'sha512').toString('hex');

    const client = new Client();
    client.clientId = clientId;
    client.clientSecretHash = hash;
    client.clientSecretSalt = salt;
    client.name = opts.name ?? null;
    client.scopes = opts.scopes ?? [];
    client.grantTypes = opts.grantTypes ?? [];

    client.redirectUris = (opts.redirectUris || []).map((u) => {
      const r = new RedirectUri();
      r.uri = u;
      return r;
    });

    const saved = await this.clients.save(client);
    return { saved, clientSecret };
  }

  async findByClientId(clientId: string) {
    return this.clients.findOne({ where: { clientId } });
  }
}
