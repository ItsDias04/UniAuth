import { ExternalClient } from '../entities/external-client.entity';

export const EXTERNAL_CLIENT_REPOSITORY = Symbol('EXTERNAL_CLIENT_REPOSITORY');

/**
 * Интерфейс репозитория — внешние OAuth2 клиенты.
 * Порт в терминах гексагональной архитектуры.
 */
export interface IExternalClientRepository {
  save(client: ExternalClient): Promise<void>;
  findById(id: string): Promise<ExternalClient | null>;
  findByClientId(clientId: string): Promise<ExternalClient | null>;
  findByOwnerId(ownerId: string): Promise<ExternalClient[]>;
  findAll(): Promise<ExternalClient[]>;
  delete(id: string): Promise<void>;
}
