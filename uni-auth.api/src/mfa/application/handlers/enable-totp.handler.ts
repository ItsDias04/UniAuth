import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EnableTotpCommand } from '../commands/enable-totp.command';
import { MfaService } from '../services/mfa.service';

@CommandHandler(EnableTotpCommand)
export class EnableTotpHandler implements ICommandHandler<EnableTotpCommand> {
  constructor(private readonly mfa: MfaService) {}

  async execute(command: EnableTotpCommand) {
    // Legacy CQRS handler kept for potential future use.
    // Prefer authenticated REST endpoints: POST /mfa/totp/enroll + POST /mfa/totp/confirm.
    return this.mfa.enrollTotpForUser({ id: command.userId });
  }
}
