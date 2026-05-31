import { randomUUID } from 'node:crypto';
import type { Database as SqliteDatabase } from 'better-sqlite3';
import type { Assignment, NewAssignmentInput } from '@/domain/entities/assignment.entity.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';

interface AssignmentRow {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

function rowToAssignment(r: AssignmentRow): Assignment {
  return {
    id: r.id,
    userId: r.user_id,
    roleId: r.role_id,
    assignedBy: r.assigned_by,
    assignedAt: r.assigned_at,
  };
}

export class SqliteAssignmentRepository implements AssignmentRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async create(input: NewAssignmentInput): Promise<Assignment> {
    const a: Assignment = {
      id: randomUUID(),
      userId: input.userId,
      roleId: input.roleId,
      assignedBy: input.assignedBy ?? null,
      assignedAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO assignments (id, user_id, role_id, assigned_by, assigned_at)
         VALUES (@id, @user_id, @role_id, @assigned_by, @assigned_at)`,
      )
      .run({
        id: a.id,
        user_id: a.userId,
        role_id: a.roleId,
        assigned_by: a.assignedBy,
        assigned_at: a.assignedAt,
      });
    return a;
  }

  async delete(userId: string, roleId: string): Promise<boolean> {
    const res = this.db
      .prepare(`DELETE FROM assignments WHERE user_id = ? AND role_id = ?`)
      .run(userId, roleId);
    return res.changes > 0;
  }

  async exists(userId: string, roleId: string): Promise<boolean> {
    const row = this.db
      .prepare<[string, string], { c: number }>(
        `SELECT COUNT(*) AS c FROM assignments WHERE user_id = ? AND role_id = ?`,
      )
      .get(userId, roleId);
    return (row?.c ?? 0) > 0;
  }

  async listByUser(userId: string): Promise<Assignment[]> {
    const rows = this.db
      .prepare<[string], AssignmentRow>(
        `SELECT * FROM assignments WHERE user_id = ? ORDER BY assigned_at DESC`,
      )
      .all(userId);
    return rows.map(rowToAssignment);
  }

  async listByRole(roleId: string): Promise<Assignment[]> {
    const rows = this.db
      .prepare<[string], AssignmentRow>(
        `SELECT * FROM assignments WHERE role_id = ? ORDER BY assigned_at DESC`,
      )
      .all(roleId);
    return rows.map(rowToAssignment);
  }

  async deleteAllForRole(roleId: string): Promise<number> {
    const res = this.db.prepare(`DELETE FROM assignments WHERE role_id = ?`).run(roleId);
    return res.changes;
  }

  async deleteAllForUser(userId: string): Promise<number> {
    const res = this.db.prepare(`DELETE FROM assignments WHERE user_id = ?`).run(userId);
    return res.changes;
  }

  async count(): Promise<number> {
    return (
      this.db
        .prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM assignments`)
        .get() as { c: number }
    ).c;
  }
}
