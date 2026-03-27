import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ConsumeExternalRedirectTokenOutput,
  ConsumeExternalRedirectTokenQuery,
} from '../../../developers-console/application/queries/consume-external-redirect-token.query';
import {
  ExternalRedirectTokenValidationResult,
  IExternalRedirectTokenVerifier,
} from '../../application/services/external-redirect-token-verifier.interface';

@Injectable()
export class DevelopersConsoleExternalTokenVerifierService
  implements IExternalRedirectTokenVerifier
{
  constructor(private readonly queryBus: QueryBus) {}

  async validateAndConsume(
    token: string,
  ): Promise<ExternalRedirectTokenValidationResult> {
    const output = await this.queryBus.execute<
      ConsumeExternalRedirectTokenQuery,
      ConsumeExternalRedirectTokenOutput
    >(new ConsumeExternalRedirectTokenQuery(token));

    return {
      userId: output.userId,
      applicationId: output.applicationId,
      redirectRoute: output.redirectRoute,
    };
  }
}
