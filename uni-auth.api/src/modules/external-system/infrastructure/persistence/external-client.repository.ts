import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IExternalClientRepository } from '../../domain/repositories/external-client.repository.interface';
import { ExternalClient } from '../../domain/entities/external-client.entity';
import { ExternalClientOrmEntity } from './external-client.orm-entity';
import { ExternalClientMapper } from './external-client.mapper';

@Injectable()
export class ExternalClientRepository implements IExternalClientRepository {
  constructor(
    @InjectRepository(ExternalClientOrmEntity)
    private readonly ormRepo: Repository<ExternalClientOrmEntity>,
  ) {}

  async save(client: ExternalClient): Promise<void> {
    const orm = ExternalClientMapper.toOrm(client);
    await this.ormRepo.save(orm);
  }

  async findById(id: string): Promise<ExternalClient | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? ExternalClientMapper.toDomain(orm) : null;
  }

  async findByClientId(clientId: string): Promise<ExternalClient | null> {
    const orm = await this.ormRepo.findOne({ where: { clientId } });
    return orm ? ExternalClientMapper.toDomain(orm) : null;
  }

  async findByOwnerId(ownerId: string): Promise<ExternalClient[]> {
    const orms = await this.ormRepo.find({ where: { ownerId } });
    return orms.map(ExternalClientMapper.toDomain);
  }

  async findAll(): Promise<ExternalClient[]> {
    const orms = await this.ormRepo.find();
    return orms.map(ExternalClientMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }
}
