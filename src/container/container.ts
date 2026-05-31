import { InMemoryRoleRepository } from '@/repositories/in-memory/in-memory-role.repository.js';
import { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-user.repository.js';
import { InMemoryAssignmentRepository } from '@/repositories/in-memory/in-memory-assignment.repository.js';
import { RoleService } from '@/services/role.service.js';
import { UserService } from '@/services/user.service.js';
import { AssignmentService } from '@/services/assignment.service.js';
import type { RoleRepository } from '@/repositories/interfaces/role.repository.js';
import type { UserRepository } from '@/repositories/interfaces/user.repository.js';
import type { AssignmentRepository } from '@/repositories/interfaces/assignment.repository.js';

export interface Container {
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
}

export function buildContainer(): Container {
  const roleRepo = new InMemoryRoleRepository();
  const userRepo = new InMemoryUserRepository();
  const assignmentRepo = new InMemoryAssignmentRepository();

  const roleService = new RoleService(roleRepo, assignmentRepo);
  const userService = new UserService(userRepo);
  const assignmentService = new AssignmentService(assignmentRepo, userRepo, roleRepo);

  return {
    repositories: { roles: roleRepo, users: userRepo, assignments: assignmentRepo },
    services: { role: roleService, user: userService, assignment: assignmentService },
  };
}
