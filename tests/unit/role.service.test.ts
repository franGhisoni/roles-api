import { describe, expect, it, beforeEach } from 'vitest';
import { RoleService } from '@/services/role.service.js';
import { InMemoryRoleRepository } from '@/repositories/in-memory/in-memory-role.repository.js';
import { InMemoryAssignmentRepository } from '@/repositories/in-memory/in-memory-assignment.repository.js';
import { ConflictError, NotFoundError } from '@/domain/errors/app-error.js';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepo: InMemoryRoleRepository;
  let assignmentRepo: InMemoryAssignmentRepository;

  beforeEach(() => {
    roleRepo = new InMemoryRoleRepository();
    assignmentRepo = new InMemoryAssignmentRepository();
    service = new RoleService(roleRepo, assignmentRepo);
  });

  it('creates a role with defaults', async () => {
    const role = await service.create({ name: 'Editor' });
    expect(role.id).toBeTypeOf('string');
    expect(role.name).toBe('Editor');
    expect(role.type).toBe('custom');
    expect(role.scope).toBe('global');
    expect(role.description).toBeNull();
  });

  it('rejects duplicate role names (case insensitive)', async () => {
    await service.create({ name: 'Admin' });
    await expect(service.create({ name: 'admin' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates a role and bumps updatedAt', async () => {
    const created = await service.create({ name: 'Viewer' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await service.update(created.id, { description: 'Read only' });
    expect(updated.description).toBe('Read only');
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  it('throws NotFound when updating an unknown role', async () => {
    await expect(
      service.update('11111111-1111-4111-8111-111111111111', { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('prevents deletion of system roles', async () => {
    const role = await service.create({ name: 'System', type: 'system' });
    await expect(service.delete(role.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('cascades assignment cleanup on delete', async () => {
    const role = await service.create({ name: 'Temp' });
    await assignmentRepo.create({
      userId: '22222222-2222-4222-8222-222222222222',
      roleId: role.id,
      assignedBy: 'test',
    });
    expect(await assignmentRepo.count()).toBe(1);
    await service.delete(role.id);
    expect(await assignmentRepo.count()).toBe(0);
  });

  it('filters and paginates list results', async () => {
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']) {
      await service.create({ name });
    }
    const page = await service.list({ page: 1, pageSize: 2, search: 'a' });
    expect(page.items.every((r) => r.name.toLowerCase().includes('a'))).toBe(true);
    expect(page.pageSize).toBe(2);
  });
});
