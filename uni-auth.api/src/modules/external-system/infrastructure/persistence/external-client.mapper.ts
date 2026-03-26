import { ExternalClient, ClientStatus } from '../../domain/entities/external-client.entity';
import { ExternalClientOrmEntity } from './external-client.orm-entity';

/**
 * Mapper — преобразование между доменной моделью и ORM-сущностью.
 */
export class ExternalClientMapper {
  static toDomain(orm: ExternalClientOrmEntity): ExternalClient {
    return ExternalClient.reconstitute({
      id: orm.id,
      name: orm.name,
      description: orm.description,
      clientId: orm.clientId,
      clientSecretHash: orm.clientSecretHash,
      redirectUris: orm.redirectUris,
      allowedGrantTypes: orm.allowedGrantTypes,
      allowedScopes: orm.allowedScopes,
      status: orm.status as ClientStatus,
      ownerId: orm.ownerId,
      homepageUrl: orm.homepageUrl,
      logoUrl: orm.logoUrl,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: ExternalClient): ExternalClientOrmEntity {
    const orm = new ExternalClientOrmEntity();
    orm.id = domain.id;
    orm.name = domain.name;
    orm.description = domain.description;
    orm.clientId = domain.clientId;
    orm.clientSecretHash = domain.clientSecretHash;
    orm.redirectUris = domain.redirectUris;
    orm.allowedGrantTypes = domain.allowedGrantTypes;
    orm.allowedScopes = domain.allowedScopes;
    orm.status = domain.status;
    orm.ownerId = domain.ownerId;
    orm.homepageUrl = domain.homepageUrl;
    orm.logoUrl = domain.logoUrl;
    return orm;
  }
}
