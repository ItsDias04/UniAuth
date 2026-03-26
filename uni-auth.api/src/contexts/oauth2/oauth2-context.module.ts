import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule } from '@nestjs/config';
import { IamContextModule } from '../iam/iam-context.module';
import {
	IOAuthRedisRepository,
	OAUTH_REDIS_REPOSITORY,
} from './domain/repositories/oauth-redis.repository.interface';
import { OAuthRedisRepository } from './infrastructure/redis/oauth-redis.repository';
import {
	IUserProfileService,
	USER_PROFILE_SERVICE,
} from './application/services/user-profile.service.interface';
import { IamUserProfileService } from './infrastructure/services/iam-user-profile.service';
import {
	IOAuthClientValidator,
	OAUTH_CLIENT_VALIDATOR,
} from './application/services/oauth-client-validator.interface';
import { ConfigOAuthClientValidatorService } from './infrastructure/services/config-oauth-client-validator.service';
import { GenerateAuthCodeHandler } from './application/handlers/generate-auth-code.handler';
import { ExchangeCodeForProfileHandler } from './application/handlers/exchange-code-for-profile.handler';
import { Oauth2SsoController } from './presentation/oauth2-sso.controller';

const CommandHandlers = [GenerateAuthCodeHandler];
const QueryHandlers = [ExchangeCodeForProfileHandler];

@Module({
	imports: [ConfigModule, CqrsModule, IamContextModule],
	controllers: [Oauth2SsoController],
	providers: [
		{
			provide: OAUTH_REDIS_REPOSITORY,
			useClass: OAuthRedisRepository,
		},
		{
			provide: USER_PROFILE_SERVICE,
			useClass: IamUserProfileService,
		},
		{
			provide: OAUTH_CLIENT_VALIDATOR,
			useClass: ConfigOAuthClientValidatorService,
		},
		...CommandHandlers,
		...QueryHandlers,
	],
	exports: [OAUTH_REDIS_REPOSITORY],
})
export class Oauth2ContextModule {}
