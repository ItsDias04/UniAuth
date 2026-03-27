import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  ConfirmIpOwnershipDto,
  ConsumeExternalRedirectTokenDto,
  CreateClientApplicationDto,
  IssueExternalRedirectTokenDto,
  UpdateClientApplicationSettingsDto,
} from './dto/developers-console.dto';
import { CreateClientApplicationCommand } from '../application/commands/create-client-application.command';
import { RequestIpOwnershipVerificationCommand } from '../application/commands/request-ip-ownership-verification.command';
import { ConfirmIpOwnershipCommand } from '../application/commands/confirm-ip-ownership.command';
import { IssueExternalRedirectTokenCommand } from '../application/commands/issue-external-redirect-token.command';
import { ConsumeExternalRedirectTokenQuery } from '../application/queries/consume-external-redirect-token.query';
import { GetOwnerApplicationsQuery } from '../application/queries/get-owner-applications.query';
import { GetApplicationByIdQuery } from '../application/queries/get-application-by-id.query';
import { UpdateClientApplicationSettingsCommand } from '../application/commands/update-client-application-settings.command';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Developers Console')
@Controller('developers-console')
export class DevelopersConsoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('applications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user applications' })
  @ApiOkResponse({ description: 'Applications list returned successfully' })
  async getOwnerApplications(@CurrentUser('sub') userId: string) {
    return this.queryBus.execute(
      new GetOwnerApplicationsQuery(userId),
    );
  }

  @Get('applications/:applicationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user application details by id' })
  @ApiOkResponse({ description: 'Application details returned successfully' })
  async getApplicationById(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.queryBus.execute(
      new GetApplicationByIdQuery(userId, applicationId),
    );
  }

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create developer application (name only)' })
  @ApiBody({ type: CreateClientApplicationDto })
  @ApiOkResponse({ description: 'Application created successfully' })
  async createApplication(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateClientApplicationDto,
  ) {
    return this.commandBus.execute(
      new CreateClientApplicationCommand(
        userId,
        dto.name,
      ),
    );
  }

  @Post('applications/:applicationId/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application settings (name and redirect route)' })
  @ApiBody({ type: UpdateClientApplicationSettingsDto })
  @ApiOkResponse({ description: 'Application settings updated successfully' })
  async updateApplicationSettings(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateClientApplicationSettingsDto,
  ) {
    return this.commandBus.execute(
      new UpdateClientApplicationSettingsCommand(
        userId,
        applicationId,
        dto.name,
        dto.redirectRoute,
      ),
    );
  }

  @Post('applications/:applicationId/ip/request-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate IP ownership verification token using redirectRoute host IP' })
  @ApiOkResponse({
    description:
      'Token returned; third-party site must call confirmation endpoint from declared IP',
  })
  async requestIpVerification(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.commandBus.execute(
      new RequestIpOwnershipVerificationCommand(
        userId,
        applicationId,
      ),
    );
  }

  @Public()
  @Post('public/ip/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm application IP ownership using token and caller IP' })
  @ApiBody({ type: ConfirmIpOwnershipDto })
  @ApiOkResponse({ description: 'IP ownership confirmed and linked to application' })
  async confirmIpOwnership(
    @Req() request: Request,
    @Body() dto: ConfirmIpOwnershipDto,
  ) {
    const requestIp = request.ip || request.socket?.remoteAddress || '';
    return this.commandBus.execute(
      new ConfirmIpOwnershipCommand(dto.token, requestIp),
    );
  }

  @Post('external/redirect-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue unique redirect token for external service (TTL 30 minutes)' })
  @ApiBody({ type: IssueExternalRedirectTokenDto })
  @ApiOkResponse({ description: 'Unique token issued and appended redirect URL returned' })
  async issueExternalRedirectToken(
    @CurrentUser('sub') userId: string,
    @Body() dto: IssueExternalRedirectTokenDto,
  ) {
    return this.commandBus.execute(
      new IssueExternalRedirectTokenCommand(userId, dto.applicationId),
    );
  }

  @Public()
  @Post('public/external/consume-redirect-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify and consume redirect token (one-time use)' })
  @ApiBody({ type: ConsumeExternalRedirectTokenDto })
  @ApiOkResponse({ description: 'Token verified and removed from Redis' })
  async consumeExternalRedirectToken(@Body() dto: ConsumeExternalRedirectTokenDto) {
    return this.queryBus.execute(
      new ConsumeExternalRedirectTokenQuery(dto.token),
    );
  }
}
