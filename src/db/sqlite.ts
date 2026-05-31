import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { logger } from '@/config/logger.js';

const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      CREATE TABLE IF NOT EXISTS roles (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        name_lower  TEXT NOT NULL UNIQUE,
        description TEXT,
        type        TEXT NOT NULL CHECK (type IN ('system','custom')),
        scope       TEXT NOT NULL CHECK (scope IN ('global','organization','project')),
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_roles_type  ON roles(type);
      CREATE INDEX IF NOT EXISTS idx_roles_scope ON roles(scope);

      CREATE TABLE IF NOT EXISTS users (
        id         TEXT PRIMARY KEY,
        email      TEXT NOT NULL UNIQUE,
        full_name  TEXT NOT NULL,
        avatar_url TEXT,
        active     INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id     TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by TEXT,
        assigned_at TEXT NOT NULL,
        UNIQUE (user_id, role_id)
      );

      CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
      CREATE INDEX IF NOT EXISTS idx_assignments_role ON assignments(role_id);
    `,
  },
];

function resolvePath(url: string): string {
  if (url === ':memory:') return ':memory:';
  // accept "file:./..." or a raw path
  return url.startsWith('file:') ? url.slice(5) : url;
}

export interface SqliteOptions {
  url: string;
}

export function openDatabase({ url }: SqliteOptions): SqliteDatabase {
  const resolved = resolvePath(url);
  if (resolved !== ':memory:') {
    const dir = path.dirname(path.resolve(resolved));
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolved);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  runMigrations(db);

  logger.info({ url: resolved }, 'SQLite database ready');
  return db;
}

function runMigrations(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  const applied = new Set<string>(
    db.prepare<[], { id: string }>('SELECT id FROM _migrations').all().map((r) => r.id),
  );
  const insert = db.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)');
  for (const m of MIGRATIONS) {
    if (applied.has(m.id)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      insert.run(m.id, new Date().toISOString());
    })();
    logger.info({ migration: m.id }, 'Applied migration');
  }
}
