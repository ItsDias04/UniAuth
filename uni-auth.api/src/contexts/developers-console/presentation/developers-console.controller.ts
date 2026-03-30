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
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import {
  AddIpToApplicationDto,
  ConfirmIpOwnershipDto,
  CreateClientApplicationDto,
  UpdateClientApplicationSettingsDto,
  SetApplicationRouteDto,
} from './dto/developers-console.dto';
import { CreateClientApplicationCommand } from '../application/commands/create-client-application.command';
import {
  RequestIpOwnershipVerificationCommand,
  RequestIpOwnershipVerificationCommandOutput,
} from '../application/commands/request-ip-ownership-verification.command';
import { ConfirmIpOwnershipCommand } from '../application/commands/confirm-ip-ownership.command';
import { IssueExternalRedirectTokenCommand } from '../application/commands/issue-external-redirect-token.command';
import { GetOwnerApplicationsQuery } from '../application/queries/get-owner-applications.query';
import { GetApplicationByIdQuery } from '../application/queries/get-application-by-id.query';
import { UpdateClientApplicationSettingsCommand } from '../application/commands/update-client-application-settings.command';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AddIpToApplicationCommand } from '../application/commands/add-ip-to-application.command';
import { LaunchApplicationToProductionCommand } from '../application/commands/launch-application-to-production.command';
import { ToggleApplicationStatusCommand } from '../application/commands/toggle-application-status.command';
import { GenerateApplicationApiTokenCommand } from '../application/commands/generate-application-api-token.command';

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
    return this.queryBus.execute(new GetOwnerApplicationsQuery(userId));
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
      new CreateClientApplicationCommand(userId, dto.name),
    );
  }

  @Post('applications/:applicationId/ip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add ip address to application' })
  @ApiBody({ type: AddIpToApplicationDto })
  @ApiOkResponse({ description: 'Application updated successfully' })
  async addIpToApplication(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: AddIpToApplicationDto,
  ) {
    return this.commandBus.execute(
      new AddIpToApplicationCommand(userId, applicationId, dto.ipAddress),
    );
  }

  @Post('applications/:applicationId/redirect-route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update application redirect route' })
  @ApiBody({ type: SetApplicationRouteDto })
  @ApiOkResponse({ description: 'Application updated successfully' })
  async updateApplicationRoute(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: SetApplicationRouteDto,
  ) {
    return this.commandBus.execute(
      new UpdateClientApplicationSettingsCommand(
        userId,
        applicationId,
        undefined,
        dto.redirectRoute,
      ),
    );
  }

  @Post('applications/:applicationId/ip/request-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Generate IP ownership verification token using redirectRoute host IP',
  })
  @ApiOkResponse({
    description:
      'Token returned; third-party site must call confirmation endpoint from declared IP',
    type: RequestIpOwnershipVerificationCommandOutput,
  })
  async requestIpVerification(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.commandBus.execute(
      new RequestIpOwnershipVerificationCommand(userId, applicationId),
    );
  }

  @Public()
  @Post('public/ip/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm application IP ownership using token and caller IP',
  })
  @ApiBody({ type: ConfirmIpOwnershipDto })
  @ApiOkResponse({
    description: 'IP ownership confirmed and linked to application',
  })
  async confirmIpOwnership(
    @Req() request: Request,
    @Body() dto: ConfirmIpOwnershipDto,
  ) {
    const requestIp = request.ip || request.socket?.remoteAddress || '';
    return this.commandBus.execute(
      new ConfirmIpOwnershipCommand(dto.token, requestIp),
    );
  }

  @Post('applications/:applicationId/token-1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue one-time Token 1 for external service (TTL 30 minutes)',
  })
  @ApiOkResponse({
    description: 'Token 1 issued successfully',
  })
  async issueApplicationToken1(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    const output = await this.commandBus.execute(
      new IssueExternalRedirectTokenCommand(userId, applicationId),
    );

    return {
      token1: output.token,
      expiresInSeconds: output.expiresInSeconds,
    };
  }

  @Post('applications/:applicationId/api-token/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate permanent API token for production application',
  })
  @ApiOkResponse({
    description: 'Application API token generated successfully',
  })
  async generateApplicationApiToken(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    const output = await this.commandBus.execute(
      new GenerateApplicationApiTokenCommand(userId, applicationId),
    );

    return {
      applicationId: output.applicationId,
      apiToken: output.apiToken,
      tokenType: 'Bearer',
    };
  }

  @Post('applications/:applicationId/launch-production')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Launch application to production (requires verified IP and redirect route)',
  })
  @ApiOkResponse({
    description: 'Application launched to production successfully',
  })
  async launchApplicationToProduction(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.commandBus.execute(
      new LaunchApplicationToProductionCommand(userId, applicationId),
    );
  }

  @Post('applications/:applicationId/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle application status between active and inactive',
  })
  @ApiOkResponse({ description: 'Application status toggled successfully' })
  async toggleApplicationStatus(
    @CurrentUser('sub') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.commandBus.execute(
      new ToggleApplicationStatusCommand(userId, applicationId),
    );
  }
}
