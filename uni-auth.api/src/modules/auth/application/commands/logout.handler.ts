import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { LogoutCommand } from './logout.command';
import { ITokenService, TOKEN_SERVICE } from '../../../token/domain/services/token.service.interface';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  private readonly logger = new Logger(LogoutHandler.name);

  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { userId, refreshToken } = command;

    // Отзываем refresh token
    await this.tokenService.revokeRefreshToken(refreshToken);

    this.logger.log(`User ${userId} logged out successfully`);
  }
}
