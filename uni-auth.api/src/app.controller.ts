import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiOperation({ summary: 'Get service information' })
  @ApiOkResponse({ description: 'Service metadata and key endpoints' })
  @Get()
  getInfo() {
    return this.appService.getInfo();
  }

  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'Service health status',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-03-27T10:00:00.000Z',
      },
    },
  })
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
