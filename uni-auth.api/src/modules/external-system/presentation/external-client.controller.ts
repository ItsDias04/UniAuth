import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterClientCommand } from '../application/commands/register-client.command';
import { RevokeClientCommand } from '../application/commands/revoke-client.command';
import { GetClientsByOwnerQuery } from '../application/queries/get-clients-by-owner.query';
import { GetAllClientsQuery } from '../application/queries/get-all-clients.query';
import { RegisterClientDto } from '../application/dto/external-system.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * Controller — управление OAuth2 клиентами (внешними системами).
 * Требует аутентификации (JWT).
 */
@Controller('external-clients')
export class ExternalClientController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /api/v1/external-clients — регистрация нового OAuth2 клиента.
   */
  @Post()
  async register(
    @Body() dto: RegisterClientDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.commandBus.execute(
      new RegisterClientCommand(
        dto.name,
        dto.description,
        dto.redirectUris,
        dto.allowedGrantTypes,
        dto.allowedScopes,
        user.sub,
        dto.homepageUrl,
        dto.logoUrl,
      ),
    );

    return {
      message: 'OAuth2 клиент зарегистрирован. Сохраните client_secret — он показывается только один раз.',
      data: result,
    };
  }

  /**
   * GET /api/v1/external-clients/my — список моих клиентов.
   */
  @Get('my')
  async getMyClients(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetClientsByOwnerQuery(user.sub));
  }

  /**
   * GET /api/v1/external-clients — список всех клиентов (admin).
   */
  @Get()
  @Roles('admin')
  async getAllClients() {
    return this.queryBus.execute(new GetAllClientsQuery());
  }

  /**
   * DELETE /api/v1/external-clients/:id — отзыв клиента.
   */
  @Delete(':id')
  async revokeClient(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    await this.commandBus.execute(
      new RevokeClientCommand(id, user.sub, reason || 'Отозвано владельцем'),
    );
    return { message: 'OAuth2 клиент отозван' };
  }
}
