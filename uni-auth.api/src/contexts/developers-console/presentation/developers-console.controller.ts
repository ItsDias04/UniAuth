import {
  Body,
  Controller,
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
  RequestIpOwnershipVerificationDto,
} from './dto/developers-console.dto';
import { CreateClientApplicationCommand } from '../application/commands/create-client-application.command';
import { RequestIpOwnershipVerificationCommand } from '../application/commands/request-ip-ownership-verification.command';
import { ConfirmIpOwnershipCommand } from '../application/commands/confirm-ip-ownership.command';
import { IssueExternalRedirectTokenCommand } from '../application/commands/issue-external-redirect-token.command';
import { ConsumeExternalRedirectTokenQuery } from '../application/queries/consume-external-redirect-token.query';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Developers Console')
@Controller('developers-console')
export class DevelopersConsoleController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create developer application' })
  @ApiBody({ type: CreateClientApplicationDto })
  @ApiOkResponse({ description: 'Application created successfully' })
  async createApplication(@Body() dto: CreateClientApplicationDto) {
    return this.commandBus.execute(
      new CreateClientApplicationCommand(
        dto.ownerUserId,
        dto.name,
        dto.redirectRoute,
      ),
    );
  }

  @Public()
  @Post('applications/:applicationId/ip/request-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate IP ownership verification token' })
  @ApiBody({ type: RequestIpOwnershipVerificationDto })
  @ApiOkResponse({
    description:
      'Token returned; third-party site must call confirmation endpoint from declared IP',
  })
  async requestIpVerification(
    @Param('applicationId') applicationId: string,
    @Body() dto: RequestIpOwnershipVerificationDto,
  ) {
    return this.commandBus.execute(
      new RequestIpOwnershipVerificationCommand(applicationId, dto.ipAddress),
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

  @Public()
  @Post('external/redirect-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue unique redirect token for external service (TTL 30 minutes)' })
  @ApiBody({ type: IssueExternalRedirectTokenDto })
  @ApiOkResponse({ description: 'Unique token issued and appended redirect URL returned' })
  async issueExternalRedirectToken(@Body() dto: IssueExternalRedirectTokenDto) {
    return this.commandBus.execute(
      new IssueExternalRedirectTokenCommand(dto.applicationId),
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
