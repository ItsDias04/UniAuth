import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';
import { ClientApplicationStatus } from '../../domain/entities/client-application.entity';

export class UpdateClientApplicationSettingsCommandOutput implements ICommandOutput {
  constructor(
    public readonly applicationId: string,
    public readonly name: string,
    public readonly redirectRoute: string,
    public readonly status: ClientApplicationStatus,
  ) {}
}

export class UpdateClientApplicationSettingsCommand
  implements ICommandInput<UpdateClientApplicationSettingsCommandOutput>
{
  constructor(
    public readonly actorUserId: string,
    public readonly applicationId: string,
    public readonly name?: string,
    public readonly redirectRoute?: string,
  ) {}
}
