import { Injectable } from '@nestjs/common';
import { ClientApplication } from '../../domain/entities/client-application.entity';
import { IClientApplicationRepository } from '../../domain/repositories/client-application.repository.interface';

@Injectable()
export class InMemoryClientApplicationRepository
  implements IClientApplicationRepository
{
  private readonly applications = new Map<string, ClientApplication>();

  async save(application: ClientApplication): Promise<void> {
    this.applications.set(application.id, application);
  }

  async findById(applicationId: string): Promise<ClientApplication | null> {
    return this.applications.get(applicationId) ?? null;
  }

  async findByOwner(ownerUserId: string): Promise<ClientApplication[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.ownerUserId === ownerUserId,
    );
  }
}
