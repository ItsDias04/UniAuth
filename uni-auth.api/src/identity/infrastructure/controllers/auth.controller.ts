import { Controller, Post, Body } from '@nestjs/common';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';
import { IdentityService } from '../../application/services/identity.service/identity.service';
import { AuthService } from '../../application/services/auth.service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly identity: IdentityService, private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.identity.createUser(dto as any);
    return { id: user.id, email: user.email };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    if (!user) return { ok: false };
    return this.auth.login(user);
  }
}
