import { beforeEach, describe, expect, it } from 'vitest';
import { AssignmentService } from '@/services/assignment.service.js';
import { InMemoryAssignmentRepository } from '@/repositories/in-memory/in-memory-assignment.repository.js';
import { InMemoryRoleRepository } from '@/repositories/in-memory/in-memory-role.repository.js';
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-user.repository.js';
import { ConflictError, NotFoundError } from '@/domain/errors/app-error.js';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let users: InMemoryUserRepository;
  let roles: InMemoryRoleRepository;
  let assignments: InMemoryAssignmentRepository;

  const userId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    users = new InMemoryUserRepository();
    roles = new InMemoryRoleRepository();
    assignments = new InMemoryAssignmentRepository();
    service = new AssignmentService(assignments, users, roles);
    users.seed([
      {
        id: userId,
        email: 'ada@example.com',
        fullName: 'Ada',
        avatarUrl: null,
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        email: 'inactive@example.com',
        fullName: 'Inactive',
        avatarUrl: null,
        active: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  it('assigns a role to a user', async () => {
    const role = await roles.create({ name: 'Editor' });
    const assignment = await service.assignRoleToUser(userId, role.id, 'tester');
    expect(assignment.userId).toBe(userId);
    expect(assignment.roleId).toBe(role.id);
    expect(assignment.assignedBy).toBe('tester');
  });

  it('rejects duplicate assignments', async () => {
    const role = await roles.create({ name: 'Editor' });
    await service.assignRoleToUser(userId, role.id);
    await expect(service.assignRoleToUser(userId, role.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('refuses to assign to inactive users', async () => {
    const role = await roles.create({ name: 'Editor' });
    await expect(
      service.assignRoleToUser('99999999-9999-4999-8999-999999999999', role.id),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns NotFound on unknown user', async () => {
    const role = await roles.create({ name: 'Editor' });
    await expect(
      service.assignRoleToUser('00000000-0000-4000-8000-000000000000', role.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('removes an assignment', async () => {
    const role = await roles.create({ name: 'Editor' });
    await service.assignRoleToUser(userId, role.id);
    await service.removeRoleFromUser(userId, role.id);
    expect(await assignments.exists(userId, role.id)).toBe(false);
  });

  it('lists user roles enriched with role data', async () => {
    const a = await roles.create({ name: 'A' });
    const b = await roles.create({ name: 'B' });
    await service.assignRoleToUser(userId, a.id);
    await service.assignRoleToUser(userId, b.id);
    const list = await service.listUserRoles(userId);
    expect(list).toHaveLength(2);
    expect(list[0]?.role.name).toBeDefined();
  });
});
