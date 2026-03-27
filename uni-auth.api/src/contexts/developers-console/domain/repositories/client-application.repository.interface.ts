import { ClientApplication } from '../entities/client-application.entity';

export const CLIENT_APPLICATION_REPOSITORY = Symbol('CLIENT_APPLICATION_REPOSITORY');

export interface IClientApplicationRepository {
  save(application: ClientApplication): Promise<void>;
  findById(applicationId: string): Promise<ClientApplication | null>;
  findByOwner(ownerUserId: string): Promise<ClientApplication[]>;
}
