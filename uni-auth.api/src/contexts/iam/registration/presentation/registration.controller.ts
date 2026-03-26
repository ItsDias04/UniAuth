import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  InitiateRegistrationDto,
  VerifyRegistrationEmailDto,
  VerifyWhatsAppAndCompleteRegistrationDto,
} from '../application/dto/registration.dto';
import {
  InitiateRegistrationCommand,
} from '../application/commands/initiate-registration.command';
import {
  VerifyRegistrationEmailCommand,
} from '../application/commands/verify-registration-email.command';
import {
  VerifyWhatsAppAndCompleteRegistrationCommand,
} from '../application/commands/verify-whatsapp-and-complete-registration.command';
import { Public } from '../../../../common/decorators/public.decorator';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('IAM Registration')
@Controller('iam/registration')
export class RegistrationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @ApiOperation({ summary: 'Initiate user registration' })
  @ApiBody({ type: InitiateRegistrationDto })
  @ApiOkResponse({
    description: 'Registration draft created and email verification code sent',
    schema: {
      example: {
        registrationId: '2b661ef0-5f6f-49f8-a2d3-6deeb8d5f8f9',
        expiresInSeconds: 1800,
        message: 'Registration initiated. Email code has been sent.',
      },
    },
  })
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  async initiate(@Body() dto: InitiateRegistrationDto) {
    return this.commandBus.execute(
      new InitiateRegistrationCommand(
        dto.login,
        dto.password,
        dto.firstName,
        dto.lastName,
        dto.phone,
        dto.email,
      ),
    );
  }

  @Public()
  @ApiOperation({ summary: 'Verify email code and send WhatsApp code' })
  @ApiBody({ type: VerifyRegistrationEmailDto })
  @ApiOkResponse({
    description: 'Email verified and temporary token issued',
    schema: {
      example: {
        tempToken: '8aeb65de-4470-4a39-9168-c3e9925be857',
        message: 'Email verified. WhatsApp code has been sent.',
      },
    },
  })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyRegistrationEmailDto) {
    return this.commandBus.execute(
      new VerifyRegistrationEmailCommand(dto.registrationId, dto.emailCode),
    );
  }

  @Public()
  @ApiOperation({ summary: 'Verify WhatsApp code and complete registration' })
  @ApiBody({ type: VerifyWhatsAppAndCompleteRegistrationDto })
  @ApiOkResponse({
    description: 'Registration completed and user account created',
    schema: {
      example: {
        userId: '55be7f0f-e651-47f2-aaf8-a6f9e3f923ba',
        message: 'Registration completed successfully',
      },
    },
  })
  @Post('verify-whatsapp')
  @HttpCode(HttpStatus.OK)
  async verifyWhatsApp(@Body() dto: VerifyWhatsAppAndCompleteRegistrationDto) {
    return this.commandBus.execute(
      new VerifyWhatsAppAndCompleteRegistrationCommand(
        dto.registrationId,
        dto.tempToken,
        dto.whatsAppCode,
      ),
    );
  }
}
