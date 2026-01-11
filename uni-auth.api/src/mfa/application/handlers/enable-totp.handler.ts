import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EnableTotpCommand } from '../commands/enable-totp.command';
import { MfaService } from '../services/mfa.service';

@CommandHandler(EnableTotpCommand)
export class EnableTotpHandler implements ICommandHandler<EnableTotpCommand> {
  constructor(private readonly mfa: MfaService) {}

  async execute(command: EnableTotpCommand) {
    const user = { id: command.userId } as any; // in real app resolve user entity
    return this.mfa.enableTOTPForUser(user);
  }
}
