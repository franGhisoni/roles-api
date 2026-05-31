import { randomUUID } from 'node:crypto';
import type { Assignment, NewAssignmentInput } from '@/domain/entities/assignment.entity.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';

const key = (userId: string, roleId: string) => `${userId}::${roleId}`;

export class InMemoryAssignmentRepository implements AssignmentRepository {
  private readonly store = new Map<string, Assignment>();

  async create(input: NewAssignmentInput): Promise<Assignment> {
    const assignment: Assignment = {
      id: randomUUID(),
      userId: input.userId,
      roleId: input.roleId,
      assignedBy: input.assignedBy ?? null,
      assignedAt: new Date().toISOString(),
    };
    this.store.set(key(input.userId, input.roleId), assignment);
    return assignment;
  }

  async delete(userId: string, roleId: string): Promise<boolean> {
    return this.store.delete(key(userId, roleId));
  }

  async exists(userId: string, roleId: string): Promise<boolean> {
    return this.store.has(key(userId, roleId));
  }

  async listByUser(userId: string): Promise<Assignment[]> {
    return [...this.store.values()].filter((a) => a.userId === userId);
  }

  async listByRole(roleId: string): Promise<Assignment[]> {
    return [...this.store.values()].filter((a) => a.roleId === roleId);
  }

  async deleteAllForRole(roleId: string): Promise<number> {
    let deleted = 0;
    for (const [k, v] of this.store.entries()) {
      if (v.roleId === roleId) {
        this.store.delete(k);
        deleted++;
      }
    }
    return deleted;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    let deleted = 0;
    for (const [k, v] of this.store.entries()) {
      if (v.userId === userId) {
        this.store.delete(k);
        deleted++;
      }
    }
    return deleted;
  }

  async count(): Promise<number> {
    return this.store.size;
  }
}
