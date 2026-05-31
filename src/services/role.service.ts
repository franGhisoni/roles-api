import type {
  ListRolesFilter,
  PagedResult,
  RoleRepository,
} from '@/repositories/interfaces/role.repository.js';
import type { NewRoleInput, Role, UpdateRoleInput } from '@/domain/entities/role.entity.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';
import { ConflictError, NotFoundError } from '@/domain/errors/app-error.js';

export class RoleService {
  constructor(
    private readonly roles: RoleRepository,
    private readonly assignments: AssignmentRepository,
  ) {}

  async create(input: NewRoleInput): Promise<Role> {
    const existing = await this.roles.findByName(input.name);
    if (existing) {
      throw new ConflictError(`Role "${input.name}" already exists`, {
        field: 'name',
      });
    }
    return this.roles.create({
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      scope: input.scope,
    });
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    const role = await this.roles.findById(id);
    if (!role) throw new NotFoundError(`Role ${id} not found`);
    if (role.type === 'system' && (input.type && input.type !== 'system')) {
      throw new ConflictError('System roles cannot change their type', {
        field: 'type',
      });
    }
    if (input.name && input.name.toLowerCase() !== role.name.toLowerCase()) {
      const dup = await this.roles.findByName(input.name);
      if (dup && dup.id !== id) {
        throw new ConflictError(`Role "${input.name}" already exists`, {
          field: 'name',
        });
      }
    }
    const updated = await this.roles.update(id, input);
    if (!updated) throw new NotFoundError(`Role ${id} not found`);
    return updated;
  }

  async getById(id: string): Promise<Role> {
    const role = await this.roles.findById(id);
    if (!role) throw new NotFoundError(`Role ${id} not found`);
    return role;
  }

  async list(filter: ListRolesFilter): Promise<PagedResult<Role>> {
    return this.roles.list(filter);
  }

  async delete(id: string): Promise<void> {
    const role = await this.roles.findById(id);
    if (!role) throw new NotFoundError(`Role ${id} not found`);
    if (role.type === 'system') {
      throw new ConflictError('System roles cannot be deleted', { id });
    }
    await this.assignments.deleteAllForRole(id);
    await this.roles.delete(id);
  }
}
