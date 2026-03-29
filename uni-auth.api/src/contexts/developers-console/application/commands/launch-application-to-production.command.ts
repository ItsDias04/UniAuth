import { ICommandInput } from '../../../../common/cqrs';

export class LaunchApplicationToProductionCommand implements ICommandInput<{ applicationId: string; status: string }> {
  constructor(
    public readonly userId: string,
    public readonly applicationId: string,
  ) {}
}
