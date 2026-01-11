import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from '../commands/create-user.command';
import { IdentityService } from '../services/identity.service/identity.service';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly identity: IdentityService) {}

  async execute(command: CreateUserCommand) {
    const { email, password, firstName, lastName, timezone } = command;
    return this.identity.createUser({ email, password, firstName, lastName, timezone });
  }
}
