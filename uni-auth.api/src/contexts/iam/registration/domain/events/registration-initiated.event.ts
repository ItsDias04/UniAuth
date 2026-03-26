import { DomainEvent } from '../../../../../common/domain';

export class RegistrationInitiatedEvent extends DomainEvent {
  constructor(
    public readonly registrationId: string,
    public readonly email: string,
    public readonly emailCode: string,
  ) {
    super('iam.registration.initiated');
  }
}
