import { DomainEvent } from '../../../../common/domain';
import { MfaType } from '../value-objects/mfa-type.vo';

export class MfaEnabledEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly mfaType: MfaType,
    public readonly deviceId: string,
  ) {
    super('mfa.enabled');
  }
}
