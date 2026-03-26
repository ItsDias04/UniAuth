import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RegisterUserDto } from '../application/dto/register-user.dto';
import { RegisterUserCommand } from '../application/commands/register-user.command';
import { BlockUserCommand } from '../application/commands/block-user.command';
import { GetUserQuery } from '../application/queries/get-user.query';
import { Request } from 'express';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /users/register — Регистрация нового пользователя.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto, @Req() req: Request) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password, dto.displayName, ip),
    );
  }

  /**
   * GET /users/me — Профиль текущего пользователя.
   */
  @Get('me')
  async getMe(@CurrentUser('sub') userId: string) {
    return this.queryBus.execute(new GetUserQuery(userId));
  }

  /**
   * GET /users/:id — Получение пользователя по ID (admin).
   */
  @Roles('admin')
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  /**
   * POST /users/:id/block — Блокировка пользователя (admin).
   */
  @Roles('admin')
  @Post(':id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  async blockUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('sub') adminId: string,
  ) {
    await this.commandBus.execute(new BlockUserCommand(id, reason, adminId));
  }
}
