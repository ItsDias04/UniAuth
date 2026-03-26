import { Injectable } from '@nestjs/common';
import { TrustedDevice } from '../../domain/entities/trusted-device.entity';
import { ITrustedDeviceRepository } from '../../domain/repositories/trusted-device.repository.interface';

/**
 * Minimal persistence adapter for current stage.
 * Can be replaced by TypeORM/PostgreSQL implementation without changing handlers.
 */
@Injectable()
export class TrustedDeviceInMemoryRepository implements ITrustedDeviceRepository {
  private readonly devices = new Map<string, TrustedDevice>();

  async save(device: TrustedDevice): Promise<void> {
    this.devices.set(device.id, device);
  }

  async findActiveByUserId(userId: string): Promise<TrustedDevice[]> {
    return Array.from(this.devices.values()).filter(
      (device) => device.userId === userId && device.isActive,
    );
  }
}
