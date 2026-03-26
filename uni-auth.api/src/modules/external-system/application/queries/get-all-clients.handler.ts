import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAllClientsQuery } from './get-all-clients.query';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';

@QueryHandler(GetAllClientsQuery)
export class GetAllClientsHandler implements IQueryHandler<GetAllClientsQuery> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
  ) {}

  async execute(_query: GetAllClientsQuery) {
    const clients = await this.clientRepository.findAll();

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
      ownerId: client.ownerId,
      createdAt: client.createdAt,
    }));
  }
}
