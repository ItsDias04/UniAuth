import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RegisterUserCommand } from './register-user.command';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<UserResponseDto> {
    const { email, password, displayName, ip } = command;

    // Проверка уникальности email
    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    // Создание агрегата через factory method
    const user = await User.register(
      randomUUID(),
      email,
      password,
      displayName,
      ip,
    );

    // Активируем пользователя (в production здесь будет email verification)
    user.activate();

    // Сохраняем
    await this.userRepository.save(user);

    // Публикуем доменные события
    for (const event of user.domainEvents) {
      this.eventBus.publish(event);
    }
    user.clearDomainEvents();

    return UserResponseDto.fromDomain(user);
  }
}
