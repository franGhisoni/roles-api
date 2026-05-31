import type { Database as SqliteDatabase } from 'better-sqlite3';
import type { User } from '@/domain/entities/user.entity.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  active: number;
  created_at: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: SqliteDatabase) {}

  seed(users: User[]) {
    const insert = this.db.prepare(
      `INSERT OR REPLACE INTO users (id, email, full_name, avatar_url, active, created_at)
       VALUES (@id, @email, @full_name, @avatar_url, @active, @created_at)`,
    );
    const tx = this.db.transaction((rows: User[]) => {
      for (const u of rows) {
        insert.run({
          id: u.id,
          email: u.email,
          full_name: u.fullName,
          avatar_url: u.avatarUrl,
          active: u.active ? 1 : 0,
          created_at: u.createdAt,
        });
      }
    });
    tx(users);
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db
      .prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`)
      .get(id);
    return row ? rowToUser(row) : null;
  }

  async list(): Promise<User[]> {
    const rows = this.db
      .prepare<[], UserRow>(
        `SELECT * FROM users ORDER BY full_name COLLATE NOCASE ASC`,
      )
      .all();
    return rows.map(rowToUser);
  }

  async count(): Promise<number> {
    return (
      this.db.prepare<[], { c: number }>(`SELECT COUNT(*) AS c FROM users`).get() as {
        c: number;
      }
    ).c;
  }
}
