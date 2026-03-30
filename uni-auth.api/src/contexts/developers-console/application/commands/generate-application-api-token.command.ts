import { ICommandInput, ICommandOutput } from '../../../../common/cqrs';

export class GenerateApplicationApiTokenCommandOutput implements ICommandOutput {
  constructor(
    public readonly applicationId: string,
    public readonly apiToken: string,
  ) {}
}

export class GenerateApplicationApiTokenCommand implements ICommandInput<GenerateApplicationApiTokenCommandOutput> {
  constructor(
    public readonly actorUserId: string,
    public readonly applicationId: string,
  ) {}
}
