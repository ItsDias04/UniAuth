import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { IdentityService } from '../../application/services/identity.service/identity.service';
import { AuthService } from '../../application/services/auth.service/auth.service';
import { SecurityService } from '../../../security/application/services/security.service';
import { SecurityEventType } from '../../../security/data/entities/security-event.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly identity: IdentityService,
    private readonly auth: AuthService,
    private readonly security: SecurityService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.identity.createUser(dto as any);
    await this.security.recordEvent({
      type: SecurityEventType.REGISTRATION,
      userId: user.id,
      success: true,
      metadata: { email: user.email },
    });
    return { id: user.id, email: user.email };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) {
      await this.security.recordEvent({
        type: SecurityEventType.LOGIN_FAILED,
        userId: null,
        success: false,
        metadata: { email: dto.email, flow: 'direct' },
      });
      return { ok: false };
    }
    await this.security.recordEvent({
      type: SecurityEventType.LOGIN,
      userId: user.id,
      success: true,
      metadata: { flow: 'direct' },
    });
    return this.auth.login(user);
  }
}
