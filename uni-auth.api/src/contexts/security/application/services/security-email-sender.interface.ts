export const SECURITY_EMAIL_SENDER = Symbol('SECURITY_EMAIL_SENDER');

export interface ISecurityEmailSender {
  sendLoginVerificationCode(email: string, code: string): Promise<void>;
}
