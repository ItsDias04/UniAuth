/**
 * Value Object — тип MFA.
 */
export enum MfaType {
  TOTP = 'totp',         // Time-based OTP (Google Authenticator и др.)
  SMS = 'sms',           // SMS код
  EMAIL = 'email',       // Email код
  PUSH = 'push',         // Push notification
}
