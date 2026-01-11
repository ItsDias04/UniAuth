import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from '../../../data/entities/user.entity';
import { Credential } from '../../../data/entities/credential.entity';
import { IdentityProfile } from '../../../data/entities/identity-profile.entity';
import { Email } from '../../../data/value-objects/email.vo';
import { PasswordHash } from '../../../data/value-objects/password-hash.vo';

export type CreateUserInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
};

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Credential)
    private readonly credentials: Repository<Credential>,
    @InjectRepository(IdentityProfile)
    private readonly profiles: Repository<IdentityProfile>,
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const emailVo = new Email(input.email);

    const exists = await this.users.findOne({ where: { email: emailVo.toString() } });
    if (exists) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = new User();
    user.email = emailVo.toString();
    user.status = AccountStatus.ACTIVE;

    const profile = new IdentityProfile();
    profile.firstName = input.firstName ?? null;
    profile.lastName = input.lastName ?? null;
    profile.timezone = input.timezone ?? null;

    const pwd = PasswordHash.createFromPlain(input.password);
    const credential = new Credential();
    credential.passwordHash = pwd.hash;
    credential.salt = pwd.salt;
    credential.lastChangedAt = new Date();

    user.profile = profile;
    user.credential = credential;

    return this.users.save(user);
  }

  async validateCredentials(email: string, plain: string): Promise<boolean> {
    const emailVo = new Email(email);
    const user = await this.users.findOne({ where: { email: emailVo.toString() } });
    if (!user || !user.credential) return false;
    const stored = PasswordHash.createFromStored(user.credential.passwordHash, user.credential.salt);
    return stored.verify(plain);
  }

  async findByEmail(email: string): Promise<User | null> {
    const emailVo = new Email(email);
    return this.users.findOne({ where: { email: emailVo.toString() } });
  }

  async findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }
}
