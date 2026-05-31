import type { Assignment } from '@/domain/entities/assignment.entity.js';
import type { Role } from '@/domain/entities/role.entity.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';
import type { RoleRepository } from '@/repositories/interfaces/role.repository.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';
import { ConflictError, NotFoundError } from '@/domain/errors/app-error.js';

export interface AssignmentWithRole extends Assignment {
  role: Role;
}

export class AssignmentService {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
  ) {}

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy?: string | null,
  ): Promise<Assignment> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError(`User ${userId} not found`);
    if (!user.active) {
      throw new ConflictError('Cannot assign roles to an inactive user', { userId });
    }
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);

    if (await this.assignments.exists(userId, roleId)) {
      throw new ConflictError('User already has this role', { userId, roleId });
    }

    return this.assignments.create({ userId, roleId, assignedBy: assignedBy ?? null });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError(`User ${userId} not found`);
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);

    const removed = await this.assignments.delete(userId, roleId);
    if (!removed) {
      throw new NotFoundError('Assignment not found', { userId, roleId });
    }
  }

  async listUserRoles(userId: string): Promise<AssignmentWithRole[]> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError(`User ${userId} not found`);
    const assignments = await this.assignments.listByUser(userId);
    const enriched: AssignmentWithRole[] = [];
    for (const a of assignments) {
      const role = await this.roles.findById(a.roleId);
      if (role) enriched.push({ ...a, role });
    }
    return enriched;
  }

  async listRoleUsers(roleId: string): Promise<Assignment[]> {
    const role = await this.roles.findById(roleId);
    if (!role) throw new NotFoundError(`Role ${roleId} not found`);
    return this.assignments.listByRole(roleId);
  }
}
