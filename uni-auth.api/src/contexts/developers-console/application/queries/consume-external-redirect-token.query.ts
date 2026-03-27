import { IQueryInput, IQueryOutput } from '../../../../common/cqrs';

export class ConsumeExternalRedirectTokenOutput implements IQueryOutput {
  constructor(
    public readonly applicationId: string,
    public readonly redirectRoute: string,
    public readonly message: string,
  ) {}
}

export class ConsumeExternalRedirectTokenQuery
  implements IQueryInput<ConsumeExternalRedirectTokenOutput>
{
  constructor(public readonly token: string) {}
}
