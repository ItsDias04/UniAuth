import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler as NestQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IQueryHandler } from '../../../../common/cqrs';
import {
  ExchangeCodeForProfileQuery,
  UserProfileOutput,
} from '../queries/exchange-code-for-profile.query';
import {
  IOAuthRedisRepository,
  OAUTH_REDIS_REPOSITORY,
} from '../../domain/repositories/oauth-redis.repository.interface';
import {
  IUserProfileService,
  USER_PROFILE_SERVICE,
} from '../services/user-profile.service.interface';

@QueryHandler(ExchangeCodeForProfileQuery)
export class ExchangeCodeForProfileHandler
  implements
    NestQueryHandler<ExchangeCodeForProfileQuery, UserProfileOutput>,
    IQueryHandler<ExchangeCodeForProfileQuery, UserProfileOutput>
{
  constructor(
    @Inject(OAUTH_REDIS_REPOSITORY)
    private readonly oauthRedisRepository: IOAuthRedisRepository,
    @Inject(USER_PROFILE_SERVICE)
    private readonly userProfileService: IUserProfileService,
  ) {}

  async execute(
    query: ExchangeCodeForProfileQuery,
  ): Promise<UserProfileOutput> {
    const codeState = await this.oauthRedisRepository.consumeAuthorizationCode(
      query.authorizationCode,
    );

    if (!codeState) {
      throw new BadRequestException('Token 3 is invalid or expired');
    }

    const profile = await this.userProfileService.getByUserId(codeState.userId);
    if (!profile) {
      throw new NotFoundException('User profile not found in IAM context');
    }

    return new UserProfileOutput(
      profile.userId,
      codeState.clientId,
      profile.email,
      profile.firstName,
      profile.lastName,
      profile.avatarUrl,
    );
  }
}
