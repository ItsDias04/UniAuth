import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserMapper } from './user.mapper';

/**
 * Infrastructure Implementation — TypeORM-реализация IUserRepository.
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepo: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const orm = await this.ormRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const orm = await this.ormRepo.findOne({
      where: { email: email.toLowerCase().trim() },
      relations: ['roles'],
    });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.ormRepo.save(data);
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const [orms, total] = await this.ormRepo.findAndCount({
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      users: orms.map(UserMapper.toDomain),
      total,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { email: email.toLowerCase().trim() },
    });
    return count > 0;
  }
}
