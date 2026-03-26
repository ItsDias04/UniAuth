export const CREDENTIALS_VERIFIER = Symbol('CREDENTIALS_VERIFIER');

export interface CredentialValidationResult {
  userId: string;
  email: string;
}

/**
 * Security context abstraction for credential validation.
 * Real implementation may rely on IAM/account storage but remains hidden behind this port.
 */
export interface ICredentialsVerifier {
  validate(email: string, password: string): Promise<CredentialValidationResult | null>;
}
