import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientApplication } from '../../domain/entities/client-application.entity';
import { IClientApplicationRepository } from '../../domain/repositories/client-application.repository.interface';
import { ClientApplicationOrmEntity } from './client-application.orm-entity';

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
      verifiedIps: application.verifiedIps,
    });
  }

  async findById(applicationId: string): Promise<ClientApplication | null> {
    const row = await this.repository.findOne({ where: { id: applicationId } });
    if (!row) return null;

    return ClientApplication.reconstitute({
      id: row.id,
      ownerUserId: row.ownerUserId,
      name: row.name,
      redirectRoute: row.redirectRoute,
      verifiedIps: row.verifiedIps || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByOwner(ownerUserId: string): Promise<ClientApplication[]> {
    const rows = await this.repository.find({
      where: { ownerUserId },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) =>
      ClientApplication.reconstitute({
        id: row.id,
        ownerUserId: row.ownerUserId,
        name: row.name,
        redirectRoute: row.redirectRoute,
        verifiedIps: row.verifiedIps || [],
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }
}
