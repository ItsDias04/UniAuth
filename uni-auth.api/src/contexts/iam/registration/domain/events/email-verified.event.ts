import { DomainEvent } from '../../../../../common/domain';

export class EmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly registrationId: string,
    public readonly phone: string,
    public readonly whatsAppCode: string,
  ) {
    super('iam.registration.email-verified');
  }
}
