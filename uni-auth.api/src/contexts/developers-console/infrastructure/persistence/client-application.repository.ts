import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientApplication } from '../../domain/entities/client-application.entity';
import { IClientApplicationRepository } from '../../domain/repositories/client-application.repository.interface';
import { ClientApplicationOrmEntity } from './client-application.orm-entity';
import { ClientApplicationStatus } from '../../domain/entities/client-application.entity';

@Injectable()
export class ClientApplicationRepository implements IClientApplicationRepository {
  constructor(
    @InjectRepository(ClientApplicationOrmEntity)
    private readonly repository: Repository<ClientApplicationOrmEntity>,
  ) {}

  async save(application: ClientApplication): Promise<void> {
    await this.repository.save({
      id: application.id,
      ownerUserId: application.ownerUserId,
      name: application.name,
      redirectRoute: application.redirectRoute,
      status: application.status,
      ip: application.ip || '',
      ipIsVerified: application.ipIsVerified,
      apiTokenHash: application.apiTokenHash,
    });
  }

  async findById(applicationId: string): Promise<ClientApplication | null> {
    const row = await this.repository.findOne({ where: { id: applicationId } });
    if (!row) return null;

    return this.toDomain(row);
  }

  async findByOwner(ownerUserId: string): Promise<ClientApplication[]> {
    const rows = await this.repository.find({
      where: { ownerUserId },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByApiTokenHash(
    apiTokenHash: string,
  ): Promise<ClientApplication | null> {
    const row = await this.repository.findOne({ where: { apiTokenHash } });
    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  private toDomain(row: ClientApplicationOrmEntity): ClientApplication {
    return ClientApplication.reconstitute({
      id: row.id,
      ownerUserId: row.ownerUserId,
      name: row.name,
      redirectRoute: row.redirectRoute,
      status: (row.status as ClientApplicationStatus) || 'draft',
      ip: row.ip,
      ipIsVerified: row.ipIsVerified,
      apiTokenHash: row.apiTokenHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
