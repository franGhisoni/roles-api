import type { Database as SqliteDatabase } from 'better-sqlite3';

import { InMemoryRoleRepository } from '@/repositories/in-memory/in-memory-role.repository.js';
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-user.repository.js';
import { InMemoryAssignmentRepository } from '@/repositories/in-memory/in-memory-assignment.repository.js';
import { SqliteRoleRepository } from '@/repositories/sqlite/sqlite-role.repository.js';
import { SqliteUserRepository } from '@/repositories/sqlite/sqlite-user.repository.js';
import { SqliteAssignmentRepository } from '@/repositories/sqlite/sqlite-assignment.repository.js';
import { openDatabase } from '@/db/sqlite.js';
import { RoleService } from '@/services/role.service.js';
import { UserService } from '@/services/user.service.js';
import { AssignmentService } from '@/services/assignment.service.js';
import type { RoleRepository } from '@/repositories/interfaces/role.repository.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';

export type PersistenceDriver = 'memory' | 'sqlite';

export interface Container {
  driver: PersistenceDriver;
  db?: SqliteDatabase;
  repositories: {
    roles: RoleRepository;
    users: UserRepository;
    assignments: AssignmentRepository;
  };
  services: {
    role: RoleService;
    user: UserService;
    assignment: AssignmentService;
  };
  shutdown: () => Promise<void>;
}

export interface BuildContainerOptions {
  driver?: PersistenceDriver;
  databaseUrl?: string;
}

export function buildContainer(opts: BuildContainerOptions = {}): Container {
  const driver: PersistenceDriver = opts.driver ?? 'memory';

  let roleRepo: RoleRepository;
  let userRepo: UserRepository;
  let assignmentRepo: AssignmentRepository;
  let db: SqliteDatabase | undefined;

  if (driver === 'sqlite') {
    db = openDatabase({ url: opts.databaseUrl ?? 'file:./data/roles.db' });
    roleRepo = new SqliteRoleRepository(db);
    userRepo = new SqliteUserRepository(db);
    assignmentRepo = new SqliteAssignmentRepository(db);
  } else {
    roleRepo = new InMemoryRoleRepository();
    userRepo = new InMemoryUserRepository();
    assignmentRepo = new InMemoryAssignmentRepository();
  }

  const roleService = new RoleService(roleRepo, assignmentRepo);
  const userService = new UserService(userRepo);
  const assignmentService = new AssignmentService(assignmentRepo, userRepo, roleRepo);

  return {
    driver,
    db,
    repositories: { roles: roleRepo, users: userRepo, assignments: assignmentRepo },
    services: { role: roleService, user: userService, assignment: assignmentService },
    shutdown: async () => {
      if (db) db.close();
    },
  };
}
