import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdentityService } from './../identity.service/identity.service';

@Injectable()
export class AuthService {
  constructor(private readonly identity: IdentityService, private readonly jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const valid = await this.identity.validateCredentials(email, password);
    if (!valid) return null;
    const user = await this.identity.findByEmail(email);
    return user;
  }

  async login(user: any) {
    if (!user) throw new UnauthorizedException();
    const payload = { sub: user.id, email: user.email };
    return { accessToken: this.jwt.sign(payload) };
  }
}
