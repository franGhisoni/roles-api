import type { Role, NewRoleInput, UpdateRoleInput } from '@/domain/entities/role.entity.js';

export interface ListRolesFilter {
  search?: string;
  type?: Role['type'];
  scope?: Role['scope'];
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoleRepository {
  create(input: NewRoleInput): Promise<Role>;
  update(id: string, input: UpdateRoleInput): Promise<Role | null>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  list(filter: ListRolesFilter): Promise<PagedResult<Role>>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
