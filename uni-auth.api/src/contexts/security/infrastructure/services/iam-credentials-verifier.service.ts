import { Inject, Injectable } from '@nestjs/common';
import { scryptSync, timingSafeEqual } from 'crypto';
import {
  USER_ACCOUNT_REPOSITORY,
  IUserAccountRepository,
} from '../../../iam/registration/domain/repositories/user-account.repository.interface';
import {
  CredentialValidationResult,
  ICredentialsVerifier,
} from '../../application/services/credentials-verifier.interface';

/**
 * Anti-corruption adapter: Security context validates credentials using IAM abstraction.
 */
@Injectable()
export class IamCredentialsVerifierService implements ICredentialsVerifier {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly userAccountRepository: IUserAccountRepository,
  ) {}

  async validate(
    email: string,
    password: string,
  ): Promise<CredentialValidationResult | null> {
    const account = await this.userAccountRepository.findAuthByEmail(email);
    if (!account) return null;

    if (!this.verifyPassword(password, account.passwordHash)) {
      return null;
    }

    return {
      userId: account.userId,
      email: account.email,
    };
  }

  private verifyPassword(plainPassword: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;

    const actualBuffer = Buffer.from(hash, 'hex');
    const expectedBuffer = scryptSync(plainPassword, salt, actualBuffer.length);

    if (actualBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(actualBuffer, expectedBuffer);
  }
}
