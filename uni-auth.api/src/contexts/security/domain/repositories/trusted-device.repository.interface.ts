import { TrustedDevice } from '../entities/trusted-device.entity';

export const TRUSTED_DEVICE_REPOSITORY = Symbol('TRUSTED_DEVICE_REPOSITORY');

export interface ITrustedDeviceRepository {
  save(device: TrustedDevice): Promise<void>;
  findActiveByUserId(userId: string): Promise<TrustedDevice[]>;
}
