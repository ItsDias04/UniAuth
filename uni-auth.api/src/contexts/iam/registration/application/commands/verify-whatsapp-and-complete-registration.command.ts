import { ICommandInput, ICommandOutput } from '../../../../../common/cqrs';

export class VerifyWhatsAppAndCompleteRegistrationCommandOutput
  implements ICommandOutput
{
  constructor(
    public readonly userId: string,
    public readonly message: string,
  ) {}
}

export class VerifyWhatsAppAndCompleteRegistrationCommand
  implements ICommandInput<VerifyWhatsAppAndCompleteRegistrationCommandOutput>
{
  constructor(
    public readonly registrationId: string,
    public readonly tempToken: string,
    public readonly whatsAppCode: string,
  ) {}
}
