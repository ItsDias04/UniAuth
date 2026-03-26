import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMfaDeviceRepository } from '../../domain/repositories/mfa-device.repository.interface';
import { MfaDevice } from '../../domain/entities/mfa-device.entity';
import { MfaDeviceOrmEntity } from './mfa-device.orm-entity';
import { MfaType } from '../../domain/value-objects/mfa-type.vo';

@Injectable()
export class MfaDeviceRepository implements IMfaDeviceRepository {
  constructor(
    @InjectRepository(MfaDeviceOrmEntity)
    private readonly ormRepo: Repository<MfaDeviceOrmEntity>,
  ) {}

  async findById(id: string): Promise<MfaDevice | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByUserId(userId: string): Promise<MfaDevice[]> {
    const orms = await this.ormRepo.find({ where: { userId } });
    return orms.map((o) => this.toDomain(o));
  }

  async findActiveByUserId(userId: string): Promise<MfaDevice[]> {
    const orms = await this.ormRepo.find({
      where: { userId, isActive: true },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async save(device: MfaDevice): Promise<void> {
    await this.ormRepo.save({
      id: device.id,
      userId: device.userId,
      type: device.type,
      secret: device.secret,
      label: device.label,
      isActive: device.isActive,
      isVerified: device.isVerified,
      backupCodes: [...device.backupCodes],
      lastUsedAt: device.lastUsedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  private toDomain(orm: MfaDeviceOrmEntity): MfaDevice {
    return MfaDevice.reconstitute({
      id: orm.id,
      userId: orm.userId,
      type: orm.type as MfaType,
      secret: orm.secret,
      label: orm.label,
      isActive: orm.isActive,
      isVerified: orm.isVerified,
      backupCodes: orm.backupCodes || [],
      lastUsedAt: orm.lastUsedAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
