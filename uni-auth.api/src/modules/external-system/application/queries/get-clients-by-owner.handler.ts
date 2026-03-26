import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetClientsByOwnerQuery } from './get-clients-by-owner.query';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';

@QueryHandler(GetClientsByOwnerQuery)
export class GetClientsByOwnerHandler implements IQueryHandler<GetClientsByOwnerQuery> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
  ) {}

  async execute(query: GetClientsByOwnerQuery) {
    const clients = await this.clientRepository.findByOwnerId(query.ownerId);

    return clients.map((client) => ({
      id: client.id,
      name: client.name,
      description: client.description,
      clientId: client.clientId,
      redirectUris: client.redirectUris,
      allowedGrantTypes: client.allowedGrantTypes,
      allowedScopes: client.allowedScopes,
      status: client.status,
      homepageUrl: client.homepageUrl,
      logoUrl: client.logoUrl,
      createdAt: client.createdAt,
    }));
  }
}
