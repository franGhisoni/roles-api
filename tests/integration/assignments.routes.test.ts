import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Container } from '@/container/container.js';
import { buildContainer } from '@/container/container.js';
import { createApp } from '@/app.js';
import { seed } from '@/seed/seed.js';

const TOKEN = process.env.API_TOKEN as string;

describe('Assignments routes (integration)', () => {
  let app: Express;
  let container: Container;
  let userId: string;
  let inactiveUserId: string;

  beforeAll(async () => {
    container = buildContainer();
    await seed(container);
    app = createApp({ container });
    const users = await container.repositories.users.list();
    userId = users.find((u) => u.active)!.id;
    inactiveUserId = users.find((u) => !u.active)!.id;
  });

  it('assigns and lists a role for a user', async () => {
    const role = await container.repositories.roles.create({ name: 'IntegrationRole' });

    const res = await request(app)
      .post(`/api/v1/users/${userId}/roles`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ roleId: role.id });
    expect(res.status).toBe(201);

    const list = await request(app)
      .get(`/api/v1/users/${userId}/roles`)
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(list.status).toBe(200);
    const ids = list.body.data.map((a: { roleId: string }) => a.roleId);
    expect(ids).toContain(role.id);

    const del = await request(app)
      .delete(`/api/v1/users/${userId}/roles/${role.id}`)
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(del.status).toBe(204);
  });

  it('rejects duplicate assignment with 409', async () => {
    const role = await container.repositories.roles.create({ name: 'DupRole' });

    const first = await request(app)
      .post(`/api/v1/users/${userId}/roles`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ roleId: role.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/users/${userId}/roles`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ roleId: role.id });
    expect(second.status).toBe(409);
  });

  it('rejects assignment to inactive user with 409', async () => {
    const role = await container.repositories.roles.create({ name: 'InactiveRole' });
    const res = await request(app)
      .post(`/api/v1/users/${inactiveUserId}/roles`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ roleId: role.id });
    expect(res.status).toBe(409);
  });

  it('returns status with uptime', async () => {
    const res = await request(app).get('/api/v1/status');
    expect(res.status).toBe(200);
    expect(res.body.uptime.ms).toBeGreaterThanOrEqual(0);
    expect(res.body.counts.users).toBeGreaterThan(0);
  });
});
