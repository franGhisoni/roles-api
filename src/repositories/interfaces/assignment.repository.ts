import type { Assignment, NewAssignmentInput } from '@/domain/entities/assignment.entity.js';

export interface AssignmentRepository {
  create(input: NewAssignmentInput): Promise<Assignment>;
  delete(userId: string, roleId: string): Promise<boolean>;
  exists(userId: string, roleId: string): Promise<boolean>;
  listByUser(userId: string): Promise<Assignment[]>;
  listByRole(roleId: string): Promise<Assignment[]>;
  deleteAllForRole(roleId: string): Promise<number>;
  deleteAllForUser(userId: string): Promise<number>;
  count(): Promise<number>;
}
