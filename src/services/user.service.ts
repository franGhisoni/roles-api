import type { User } from '@/domain/entities/user.entity.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';
import { NotFoundError } from '@/domain/errors/app-error.js';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async list(): Promise<User[]> {
    return this.users.list();
  }

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }
}
