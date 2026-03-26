import { Inject, Injectable } from '@nestjs/common';
import {
  USER_ACCOUNT_REPOSITORY,
  IUserAccountRepository,
} from '../../../iam/registration/domain/repositories/user-account.repository.interface';
import {
  IUserProfileService,
  UserProfileReadModel,
} from '../../application/services/user-profile.service.interface';

/**
 * Anti-corruption adapter: OAuth2 context requests profile data through IAM repository abstraction,
 * not by touching IAM persistence directly.
 */
@Injectable()
export class IamUserProfileService implements IUserProfileService {
  constructor(
    @Inject(USER_ACCOUNT_REPOSITORY)
    private readonly userAccountRepository: IUserAccountRepository,
  ) {}

  async getByUserId(userId: string): Promise<UserProfileReadModel | null> {
    const profile = await this.userAccountRepository.findProfileById(userId);
    if (!profile) return null;

    return {
      userId: profile.userId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
    };
  }
}
