import { randomUUID } from 'node:crypto';
import type { Database as SqliteDatabase } from 'better-sqlite3';
import type {
  NewRoleInput,
  Role,
  RoleScope,
  RoleType,
  UpdateRoleInput,
} from '@/domain/entities/role.entity.js';
import type {
  ListRolesFilter,
  PagedResult,
  RoleRepository,
} from '@/repositories/interfaces/role.repository.js';

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

function rowToRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as RoleType,
    scope: row.scope as RoleScope,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteRoleRepository implements RoleRepository {
  constructor(private readonly db: SqliteDatabase) {}

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
    this.db
      .prepare(
        `INSERT INTO roles (id, name, name_lower, description, type, scope, created_at, updated_at)
         VALUES (@id, @name, @name_lower, @description, @type, @scope, @created_at, @updated_at)`,
      )
      .run({
        id: role.id,
        name: role.name,
        name_lower: role.name.toLowerCase(),
        description: role.description,
        type: role.type,
        scope: role.scope,
        created_at: role.createdAt,
        updated_at: role.updatedAt,
      });
    return role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: Role = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.scope !== undefined ? { scope: input.scope } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `UPDATE roles
           SET name = @name,
               name_lower = @name_lower,
               description = @description,
               type = @type,
               scope = @scope,
               updated_at = @updated_at
         WHERE id = @id`,
      )
      .run({
        id,
        name: updated.name,
        name_lower: updated.name.toLowerCase(),
        description: updated.description,
        type: updated.type,
        scope: updated.scope,
        updated_at: updated.updatedAt,
      });
    return updated;
  }

  async findById(id: string): Promise<Role | null> {
    const row = this.db
      .prepare<[string], RoleRow>(`SELECT * FROM roles WHERE id = ?`)
      .get(id);
    return row ? rowToRole(row) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const row = this.db
      .prepare<[string], RoleRow>(`SELECT * FROM roles WHERE name_lower = ?`)
      .get(name.trim().toLowerCase());
    return row ? rowToRole(row) : null;
  }

  async list(filter: ListRolesFilter): Promise<PagedResult<Role>> {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (filter.search) {
      where.push(`(name_lower LIKE @q OR LOWER(COALESCE(description,'')) LIKE @q)`);
      params.q = `%${filter.search.toLowerCase()}%`;
    }
    if (filter.type) {
      where.push(`type = @type`);
      params.type = filter.type;
    }
    if (filter.scope) {
      where.push(`scope = @scope`);
      params.scope = filter.scope;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (
      this.db
        .prepare<typeof params, { c: number }>(
          `SELECT COUNT(*) AS c FROM roles ${whereSql}`,
        )
        .get(params) as { c: number }
    ).c;

    const offset = (filter.page - 1) * filter.pageSize;
    const rows = this.db
      .prepare<typeof params & { limit: number; offset: number }, RoleRow>(
        `SELECT * FROM roles ${whereSql} ORDER BY name COLLATE NOCASE ASC LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit: filter.pageSize, offset });

    return {
      items: rows.map(rowToRole),
      total,
      page: filter.page,
      pageSize: filter.pageSize,
    };
  }

  async delete(id: string): Promise<boolean> {
    const res = this.db.prepare(`DELETE FROM roles WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  async count(): Promise<number> {
    return (
      this.db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM roles`).get() as {
        c: number;
      }
    ).c;
  }
}
