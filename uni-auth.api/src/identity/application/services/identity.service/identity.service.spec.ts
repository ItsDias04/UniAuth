import { IdentityService } from './identity.service';
import { PasswordHash } from '../../../data/value-objects/password-hash.vo';

describe('IdentityService (unit)', () => {
  let service: IdentityService;
  const usersRepo: any = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const credentialsRepo: any = {
    // not used directly in tests but provided
  };
  const profilesRepo: any = {};

  beforeEach(() => {
    usersRepo.findOne.mockReset();
    usersRepo.save.mockReset();
    // @ts-ignore - instantiate with mocked repos
    service = new IdentityService(usersRepo, credentialsRepo, profilesRepo);
  });

  it('creates a new user', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    const saved = { id: 'uuid-1', email: 'test@example.com' };
    usersRepo.save.mockResolvedValue(saved);

    const result = await service.createUser({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'T',
    });

    expect(usersRepo.findOne).toHaveBeenCalled();
    expect(usersRepo.save).toHaveBeenCalled();
    expect(result).toEqual(saved);
  });

  it('validates credentials successfully', async () => {
    const plain = 'secret-pass';
    const pwd = PasswordHash.createFromPlain(plain);
    const user = {
      id: 'u1',
      email: 'a@b.com',
      credential: { passwordHash: pwd.hash, salt: pwd.salt },
    } as any;
    usersRepo.findOne.mockResolvedValue(user);

    const ok = await service.validateCredentials('a@b.com', plain);
    expect(ok).toBe(true);
  });
});
