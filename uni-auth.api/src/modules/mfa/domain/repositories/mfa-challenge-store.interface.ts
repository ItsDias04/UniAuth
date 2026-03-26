import { MfaChallenge } from '../value-objects/mfa-challenge.vo';

export const MFA_CHALLENGE_STORE = Symbol('MFA_CHALLENGE_STORE');

/**
 * Интерфейс хранилища MFA challenges (Redis-backed).
 */
export interface IMfaChallengeStore {
  save(challenge: MfaChallenge, ttlSeconds: number): Promise<void>;
  find(challengeId: string): Promise<MfaChallenge | null>;
  delete(challengeId: string): Promise<void>;
}
