import type { User } from '@/domain/entities/user.entity.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  seed(users: User[]) {
    for (const u of users) this.store.set(u.id, u);
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }

  async list(): Promise<User[]> {
    return [...this.store.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async count(): Promise<number> {
    return this.store.size;
  }
}
