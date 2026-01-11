import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ClientsService } from '../../application/services/clients.service';
import { RegisterClientDto } from '../../dto/register-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Post('register')
  async register(@Body() dto: RegisterClientDto) {
    const { saved, clientSecret } = await this.svc.registerClient(dto);
    return {
      id: saved.id,
      clientId: saved.clientId,
      clientSecret,
      name: saved.name,
      redirectUris: saved.redirectUris.map((r) => r.uri),
      scopes: saved.scopes,
      grantTypes: saved.grantTypes,
    };
  }

  @Get(':clientId')
  async get(@Param('clientId') clientId: string) {
    const c = await this.svc.findByClientId(clientId);
    if (!c) return { found: false };
    return {
      id: c.id,
      clientId: c.clientId,
      name: c.name,
      redirectUris: c.redirectUris.map((r) => r.uri),
      scopes: c.scopes,
      grantTypes: c.grantTypes,
    };
  }
}
