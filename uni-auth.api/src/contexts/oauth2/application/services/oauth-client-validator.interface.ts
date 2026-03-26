export const OAUTH_CLIENT_VALIDATOR = Symbol('OAUTH_CLIENT_VALIDATOR');

export interface IOAuthClientValidator {
  validate(clientId: string, redirectUri: string): Promise<void>;
}
