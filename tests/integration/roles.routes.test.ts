import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

import { buildContainer } from '@/container/container.js';
import { createApp } from '@/app.js';

const TOKEN = process.env.API_TOKEN as string;

describe('Roles routes (integration)', () => {
  let app: Express;

  beforeAll(() => {
    const container = buildContainer();
    app = createApp({ container });
  });

  it('GET /api/v1/healthz is public', async () => {
    const res = await request(app).get('/api/v1/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/v1/roles rejects without token', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/roles rejects with wrong token', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', 'Bearer wrong-token');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/roles validates input', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('full CRUD + duplicate check', async () => {
    const created = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'Editor', description: 'edits' });
    expect(created.status).toBe(201);
    const roleId = created.body.data.id as string;

    const duplicate = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ name: 'editor' });
    expect(duplicate.status).toBe(409);

    const updated = await request(app)
      .patch(`/api/v1/roles/${roleId}`)
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ description: 'edits things' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.description).toBe('edits things');

    const deleted = await request(app)
      .delete(`/api/v1/roles/${roleId}`)
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(deleted.status).toBe(204);
  });

  it('returns 404 on unknown role', async () => {
    const res = await request(app)
      .get('/api/v1/roles/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(res.status).toBe(404);
  });

  it('serves the OpenAPI spec', async () => {
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/roles']).toBeDefined();
  });
});
