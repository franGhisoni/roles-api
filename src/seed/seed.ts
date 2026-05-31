import type { Container } from '@/container/container.js';
import type { User } from '@/domain/entities/user.entity.js';
import type { InMemoryUserRepository } from '@/repositories/in-memory/in-memory-user.repository.js';

const USERS: User[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'ada.lovelace@example.com',
    fullName: 'Ada Lovelace',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    active: true,
    createdAt: '2024-01-01T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'alan.turing@example.com',
    fullName: 'Alan Turing',
    avatarUrl: 'https://i.pravatar.cc/120?img=12',
    active: true,
    createdAt: '2024-01-02T10:00:00.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'grace.hopper@example.com',
    fullName: 'Grace Hopper',
    avatarUrl: 'https://i.pravatar.cc/120?img=32',
    active: true,
    createdAt: '2024-01-03T10:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'linus.torvalds@example.com',
    fullName: 'Linus Torvalds',
    avatarUrl: 'https://i.pravatar.cc/120?img=15',
    active: true,
    createdAt: '2024-01-04T10:00:00.000Z',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'margaret.hamilton@example.com',
    fullName: 'Margaret Hamilton',
    avatarUrl: 'https://i.pravatar.cc/120?img=24',
    active: true,
    createdAt: '2024-01-05T10:00:00.000Z',
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'dennis.ritchie@example.com',
    fullName: 'Dennis Ritchie',
    avatarUrl: 'https://i.pravatar.cc/120?img=18',
    active: true,
    createdAt: '2024-01-06T10:00:00.000Z',
  },
  {
    id: '77777777-7777-4777-8777-777777777777',
    email: 'inactive.user@example.com',
    fullName: 'Old Account',
    avatarUrl: null,
    active: false,
    createdAt: '2023-06-01T10:00:00.000Z',
  },
];

const ROLES = [
  { name: 'Super Admin', description: 'Full system access', type: 'system', scope: 'global' },
  { name: 'Admin', description: 'Manage users and roles', type: 'system', scope: 'organization' },
  { name: 'Editor', description: 'Can create and edit content', type: 'custom', scope: 'organization' },
  { name: 'Viewer', description: 'Read-only access', type: 'custom', scope: 'organization' },
  { name: 'Billing Manager', description: 'Manage subscription and invoices', type: 'custom', scope: 'organization' },
  { name: 'Project Lead', description: 'Lead on a single project', type: 'custom', scope: 'project' },
  { name: 'Auditor', description: 'Read-only access to audit logs', type: 'custom', scope: 'global' },
] as const;

export async function seed(container: Container) {
  (container.repositories.users as InMemoryUserRepository).seed(USERS);

  const createdRoles = [];
  for (const r of ROLES) {
    createdRoles.push(
      await container.repositories.roles.create({
        name: r.name,
        description: r.description,
        type: r.type,
        scope: r.scope,
      }),
    );
  }

  const editor = createdRoles.find((r) => r.name === 'Editor');
  const viewer = createdRoles.find((r) => r.name === 'Viewer');
  const admin = createdRoles.find((r) => r.name === 'Admin');

  if (editor) {
    await container.repositories.assignments.create({
      userId: USERS[0]!.id,
      roleId: editor.id,
      assignedBy: 'seed',
    });
  }
  if (viewer) {
    await container.repositories.assignments.create({
      userId: USERS[1]!.id,
      roleId: viewer.id,
      assignedBy: 'seed',
    });
  }
  if (admin) {
    await container.repositories.assignments.create({
      userId: USERS[2]!.id,
      roleId: admin.id,
      assignedBy: 'seed',
    });
  }
}
