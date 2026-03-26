export const WHATSAPP_SENDER = Symbol('WHATSAPP_SENDER');

export interface IWhatsAppSender {
  sendRegistrationCode(phone: string, code: string): Promise<void>;
}
