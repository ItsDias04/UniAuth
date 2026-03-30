export const DEVELOPERS_CONSOLE_REDIS_REPOSITORY = Symbol(
  'DEVELOPERS_CONSOLE_REDIS_REPOSITORY',
);

export interface IpVerificationTokenState {
  token: string;
  applicationId: string;
  expectedIp: string;
}

export interface ExternalRedirectTokenState {
  token: string;
  applicationId: string;
  redirectRoute: string;
}

export interface IDevelopersConsoleRedisRepository {
  saveIpVerificationToken(
    state: IpVerificationTokenState,
    ttlSeconds: number,
  ): Promise<void>;

  consumeIpVerificationToken(
    token: string,
  ): Promise<IpVerificationTokenState | null>;

  saveExternalRedirectToken(
    state: ExternalRedirectTokenState,
    ttlSeconds: number,
  ): Promise<void>;

  consumeExternalRedirectToken(
    token: string,
  ): Promise<ExternalRedirectTokenState | null>;
}
