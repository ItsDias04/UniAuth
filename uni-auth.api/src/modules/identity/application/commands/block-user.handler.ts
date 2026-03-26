import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { BlockUserCommand } from './block-user.command';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<BlockUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: BlockUserCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.block(command.reason, command.blockedBy);
    await this.userRepository.save(user);

    for (const event of user.domainEvents) {
      this.eventBus.publish(event);
    }
    user.clearDomainEvents();
  }
}
