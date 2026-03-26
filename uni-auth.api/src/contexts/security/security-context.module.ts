import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamContextModule } from '../iam/iam-context.module';
import { LoginToAuthenticatorHandler } from './application/handlers/login-to-authenticator.handler';
import { VerifyAuthenticatorEmailHandler } from './application/handlers/verify-authenticator-email.handler';
import { InitiateLoginHandler } from './application/handlers/initiate-login.handler';
import { VerifyMfaAndLoginHandler } from './application/handlers/verify-mfa-and-login.handler';
import {
	AUTHENTICATOR_REDIS_REPOSITORY,
	IAuthenticatorRedisRepository,
} from './domain/repositories/authenticator-redis.repository.interface';
import { AuthenticatorRedisRepository } from './infrastructure/redis/authenticator-redis.repository';
import {
	SECURITY_EMAIL_SENDER,
	ISecurityEmailSender,
} from './application/services/security-email-sender.interface';
import { SecurityConsoleEmailSender } from './infrastructure/services/console-email.sender';
import {
	CREDENTIALS_VERIFIER,
	ICredentialsVerifier,
} from './application/services/credentials-verifier.interface';
import { IamCredentialsVerifierService } from './infrastructure/services/iam-credentials-verifier.service';
import {
	TRUSTED_DEVICE_REPOSITORY,
	ITrustedDeviceRepository,
} from './domain/repositories/trusted-device.repository.interface';
import { TrustedDeviceInMemoryRepository } from './infrastructure/persistence/trusted-device.in-memory.repository';
import { AuthenticatorLoginController } from './presentation/authenticator-login.controller';
import { BrowserLoginController } from './presentation/browser-login.controller';
import {
	LOGIN_MFA_STATE_REPOSITORY,
	ILoginMfaStateRepository,
} from './domain/repositories/login-mfa-state.repository.interface';
import { LoginMfaStateRedisRepository } from './infrastructure/redis/login-mfa-state.redis.repository';
import {
	AUTH_SESSION_REPOSITORY,
	IAuthSessionRepository,
} from './domain/repositories/auth-session.repository.interface';
import { AuthSessionRepository } from './infrastructure/persistence/auth-session.repository';
import { AuthSessionOrmEntity } from './infrastructure/persistence/auth-session.orm-entity';
import { JwtTokenIssuerService } from './infrastructure/services/jwt-token-issuer.service';
import {
	ITokenIssuer,
	TOKEN_ISSUER,
} from './application/services/token-issuer.interface';

const CommandHandlers = [
	LoginToAuthenticatorHandler,
	VerifyAuthenticatorEmailHandler,
	InitiateLoginHandler,
	VerifyMfaAndLoginHandler,
];

@Module({
	imports: [
		ConfigModule,
		CqrsModule,
		IamContextModule,
		TypeOrmModule.forFeature([AuthSessionOrmEntity]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
			}),
		}),
	],
	controllers: [AuthenticatorLoginController, BrowserLoginController],
	providers: [
		{
			provide: AUTHENTICATOR_REDIS_REPOSITORY,
			useClass: AuthenticatorRedisRepository,
		},
		{
			provide: SECURITY_EMAIL_SENDER,
			useClass: SecurityConsoleEmailSender,
		},
		{
			provide: CREDENTIALS_VERIFIER,
			useClass: IamCredentialsVerifierService,
		},
		{
			provide: TRUSTED_DEVICE_REPOSITORY,
			useClass: TrustedDeviceInMemoryRepository,
		},
		{
			provide: LOGIN_MFA_STATE_REPOSITORY,
			useClass: LoginMfaStateRedisRepository,
		},
		{
			provide: AUTH_SESSION_REPOSITORY,
			useClass: AuthSessionRepository,
		},
		{
			provide: TOKEN_ISSUER,
			useClass: JwtTokenIssuerService,
		},
		...CommandHandlers,
	],
	exports: [TRUSTED_DEVICE_REPOSITORY],
})
export class SecurityContextModule {}
