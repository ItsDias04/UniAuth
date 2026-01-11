import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterClientCommand } from '../commands/register-client.command';
import { ClientsService } from '../services/clients.service';

@CommandHandler(RegisterClientCommand)
export class RegisterClientHandler implements ICommandHandler<RegisterClientCommand> {
  constructor(private readonly svc: ClientsService) {}

  async execute(cmd: RegisterClientCommand) {
    const { name, redirectUris, scopes, grantTypes } = cmd;
    return this.svc.registerClient({ name, redirectUris, scopes, grantTypes });
  }
}
