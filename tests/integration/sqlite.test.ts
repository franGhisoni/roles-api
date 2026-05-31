import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Container } from '@/container/container.js';
import { buildContainer } from '@/container/container.js';
import { createApp } from '@/app.js';
import { seed } from '@/seed/seed.js';

const TOKEN = process.env.API_TOKEN as string;

describe('SQLite driver (integration, :memory: DB)', () => {
  let app: Express;
  let container: Container;

  beforeAll(async () => {
    container = buildContainer({ driver: 'sqlite', databaseUrl: ':memory:' });
    await seed(container);
    app = createApp({ container });
  });

  it('persists role through the SQL repository', async () => {
    const create = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'SqlRole', description: 'persisted in sqlite' });
    expect(create.status).toBe(201);
    const id = create.body.data.id as string;

    const get = await request(app)
      .get(`/api/v1/roles/${id}`)
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(get.status).toBe(200);
    expect(get.body.data.name).toBe('SqlRole');
  });

  it('enforces UNIQUE constraint via service layer', async () => {
    const a = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'UniqueName' });
    expect(a.status).toBe(201);
    const b = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'uniquename' });
    expect(b.status).toBe(409);
  });

  it('cascades assignment cleanup on role delete', async () => {
    const role = await container.repositories.roles.create({ name: 'CascadeRole' });
    const users = await container.repositories.users.list();
    const user = users.find((u) => u.active)!;
    await container.repositories.assignments.create({
      userId: user.id,
      roleId: role.id,
      assignedBy: 'test',
    });
    expect(await container.repositories.assignments.exists(user.id, role.id)).toBe(true);
    const del = await request(app)
      .delete(`/api/v1/roles/${role.id}`)
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(del.status).toBe(204);
    expect(await container.repositories.assignments.exists(user.id, role.id)).toBe(false);
  });
});
