import { MfaDevice } from '../entities/mfa-device.entity';

export const MFA_DEVICE_REPOSITORY = Symbol('MFA_DEVICE_REPOSITORY');

export interface IMfaDeviceRepository {
  findById(id: string): Promise<MfaDevice | null>;
  findByUserId(userId: string): Promise<MfaDevice[]>;
  findActiveByUserId(userId: string): Promise<MfaDevice[]>;
  save(device: MfaDevice): Promise<void>;
  delete(id: string): Promise<void>;
}
