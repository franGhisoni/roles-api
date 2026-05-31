import { randomUUID } from 'node:crypto';
import type {
  ListRolesFilter,
  PagedResult,
  RoleRepository,
} from '@/repositories/interfaces/role.repository.js';
import type { NewRoleInput, Role, UpdateRoleInput } from '@/domain/entities/role.entity.js';

export class InMemoryRoleRepository implements RoleRepository {
  private readonly store = new Map<string, Role>();

  async create(input: NewRoleInput): Promise<Role> {
    const now = new Date().toISOString();
    const role: Role = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? null,
      type: input.type ?? 'custom',
      scope: input.scope ?? 'global',
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(role.id, role);
    return role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated: Role = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<Role | null> {
    return this.store.get(id) ?? null;
  }

  async findByName(name: string): Promise<Role | null> {
    const target = name.trim().toLowerCase();
    for (const role of this.store.values()) {
      if (role.name.toLowerCase() === target) return role;
    }
    return null;
  }

  async list(filter: ListRolesFilter): Promise<PagedResult<Role>> {
    let items = [...this.store.values()];
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filter.type) items = items.filter((r) => r.type === filter.type);
    if (filter.scope) items = items.filter((r) => r.scope === filter.scope);
    items.sort((a, b) => a.name.localeCompare(b.name));
    const total = items.length;
    const start = (filter.page - 1) * filter.pageSize;
    const paged = items.slice(start, start + filter.pageSize);
    return { items: paged, total, page: filter.page, pageSize: filter.pageSize };
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async count(): Promise<number> {
    return this.store.size;
  }
}
