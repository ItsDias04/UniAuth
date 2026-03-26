export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface IEmailSender {
  sendRegistrationCode(email: string, code: string): Promise<void>;
}
