import { Inject, Injectable } from '@nestjs/common';
import {
  DEVELOPERS_CONSOLE_EXTERNAL_REDIRECT_TOKEN_GATEWAY,
  IExternalRedirectTokenGateway,
} from '../../../developers-console/application/services/external-redirect-token-gateway.interface';
import {
  ExternalRedirectTokenValidationResult,
  IExternalRedirectTokenVerifier,
} from '../../application/services/external-redirect-token-verifier.interface';

@Injectable()
export class DevelopersConsoleExternalTokenVerifierService implements IExternalRedirectTokenVerifier {
  constructor(
    @Inject(DEVELOPERS_CONSOLE_EXTERNAL_REDIRECT_TOKEN_GATEWAY)
    private readonly externalTokenGateway: IExternalRedirectTokenGateway,
  ) {}

  async validateAndConsume(
    token: string,
  ): Promise<ExternalRedirectTokenValidationResult> {
    const output = await this.externalTokenGateway.validateAndConsume(token);

    return {
      applicationId: output.applicationId,
      redirectRoute: output.redirectRoute,
    };
  }
}
