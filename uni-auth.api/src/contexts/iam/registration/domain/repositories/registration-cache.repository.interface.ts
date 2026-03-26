import { RegistrationDraft } from '../entities/registration-draft.entity';

export const REGISTRATION_CACHE_REPOSITORY = Symbol('REGISTRATION_CACHE_REPOSITORY');

export interface IRegistrationCacheRepository {
  save(draft: RegistrationDraft, ttlSeconds: number): Promise<void>;
  findById(registrationId: string): Promise<RegistrationDraft | null>;
  delete(registrationId: string): Promise<void>;
}
