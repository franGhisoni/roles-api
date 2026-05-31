import type { User } from '@/domain/entities/user.entity.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  count(): Promise<number>;
}
