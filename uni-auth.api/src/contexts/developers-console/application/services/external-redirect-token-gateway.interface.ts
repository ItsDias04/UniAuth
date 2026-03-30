export const DEVELOPERS_CONSOLE_EXTERNAL_REDIRECT_TOKEN_GATEWAY = Symbol(
  'DEVELOPERS_CONSOLE_EXTERNAL_REDIRECT_TOKEN_GATEWAY',
);

export interface ExternalRedirectTokenValidationResult {
  applicationId: string;
  redirectRoute: string;
}

/**
 * Gateway exposed to other contexts for one-time external redirect token validation.
 */
export interface IExternalRedirectTokenGateway {
  validateAndConsume(
    token: string,
  ): Promise<ExternalRedirectTokenValidationResult>;
}
