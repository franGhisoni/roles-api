# roles-api

REST API for managing **roles** and their **assignment to users** (RBAC), with Swagger docs, healthchecks, structured logging, request validation, rate limiting and a comprehensive test suite.

Built with **Express + TypeScript** following a layered architecture: `controllers → services → repositories`, with a tiny DI container so the in-memory persistence layer can be swapped for SQLite/Postgres without touching the rest of the code.

---

## Stack

| Concern        | Choice                                          |
| -------------- | ----------------------------------------------- |
| Runtime        | Node 20, TypeScript 5, ESM                      |
| HTTP framework | Express 4                                       |
| Validation     | Zod (request body / query / params)             |
| Security       | Helmet, CORS, express-rate-limit, timing-safe token compare |
| Observability  | Pino + pino-http, X-Request-Id correlation, `/status` endpoint with uptime/memory/counts |
| Docs           | OpenAPI 3.0 spec + Swagger UI at `/docs`        |
| Tests          | Vitest + Supertest (24 unit + integration tests) |
| Container      | Multi-stage Dockerfile, non-root user, healthcheck |
| Deploy         | Railway (Dockerfile + Nixpacks fallback)        |

---

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

- `http://localhost:4000/`           — service banner
- `http://localhost:4000/docs`       — Swagger UI (set the Bearer token from `.env` once via "Authorize")
- `http://localhost:4000/api/v1/status` — uptime, memory, counts (public)

Default seeded token (dev only): `dev-token-please-change-me-1234567890`.

---

## Scripts

| Script             | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Hot-reload (tsx watch)                             |
| `npm run build`    | Type-checked production build to `dist/`           |
| `npm start`        | Run compiled output                                |
| `npm test`         | Vitest (unit + integration, ~750ms)                |
| `npm run test:coverage` | Coverage report (v8)                          |
| `npm run typecheck` | `tsc --noEmit`                                    |

---

## Environment

| Var                     | Default                                  | Notes                                              |
| ----------------------- | ---------------------------------------- | -------------------------------------------------- |
| `NODE_ENV`              | `development`                            | `development` \| `test` \| `production`            |
| `PORT`                  | `4000`                                   |                                                    |
| `HOST`                  | `0.0.0.0`                                |                                                    |
| `API_TOKEN`             | dev placeholder                          | Must be ≥ 16 chars. Required in prod.              |
| `CORS_ORIGIN`           | `*`                                      | Or comma-separated origins                         |
| `LOG_LEVEL`             | `info`                                   | pino levels                                        |
| `RATE_LIMIT_WINDOW_MS`  | `60000`                                  |                                                    |
| `RATE_LIMIT_MAX`        | `300`                                    | Per IP per window, only `/api/*`                   |
| `SEED_DATA`             | `true`                                   | Seed 7 users + 7 roles + 3 assignments at boot     |

All env vars are validated at boot via Zod. Invalid config fails fast with a readable error.

---

## Architecture

```
src/
├── config/        env loader (Zod-validated), pino logger
├── domain/        entities + AppError hierarchy
├── schemas/       Zod request schemas (body/query/params)
├── repositories/  RoleRepository, UserRepository, AssignmentRepository
│   ├── interfaces/      pure contracts — easy to swap to SQLite/Prisma
│   └── in-memory/       Map-backed default implementations
├── services/      business rules (uniqueness, cascades, system-role guards)
├── controllers/   thin HTTP adapters
├── middlewares/   auth (timing-safe), validate, requestId, requestLogger, errorHandler
├── routes/        Express routers, wired through buildApiRouter()
├── docs/          OpenAPI 3 spec + Swagger UI mount
├── container/     buildContainer() — DI composition root
├── seed/          deterministic in-memory seed data
├── utils/         asyncHandler
├── app.ts         createApp(): assembles the Express pipeline (no listen)
└── server.ts      loads env, builds container, seeds, listens, traps SIGTERM
```

**Why the split?**
- `app.ts` is pure: it takes a container and returns an Express app. That's what tests import.
- `server.ts` is the only file that touches `process.exit`, signals and ports.
- The DI container lets you replace `InMemoryRoleRepository` with a real DB by changing one file.

---

## API

Base path: `/api/v1`.

| Method | Path                                     | Auth | Description                          |
| ------ | ---------------------------------------- | :--: | ------------------------------------ |
| GET    | `/healthz`                               |  —   | Liveness                             |
| GET    | `/readyz`                                |  —   | Readiness                            |
| GET    | `/status`                                |  —   | Uptime, memory, runtime, counts      |
| GET    | `/roles`                                 |  ✓   | List (paginated, searchable, filterable by `type`/`scope`) |
| POST   | `/roles`                                 |  ✓   | Create                               |
| GET    | `/roles/:id`                             |  ✓   | Get by id                            |
| PATCH  | `/roles/:id`                             |  ✓   | Update                               |
| DELETE | `/roles/:id`                             |  ✓   | Delete (system roles refused, cascades assignments) |
| GET    | `/users`                                 |  ✓   | List seeded users                    |
| GET    | `/users/:id`                             |  ✓   | Get user                             |
| GET    | `/users/:userId/roles`                   |  ✓   | List a user's roles (enriched)       |
| POST   | `/users/:userId/roles`                   |  ✓   | Assign role to user                  |
| DELETE | `/users/:userId/roles/:roleId`           |  ✓   | Remove role from user                |

Errors follow a consistent envelope:

```json
{
  "error": { "code": "CONFLICT", "message": "Role \"Admin\" already exists", "details": { "field": "name" } },
  "requestId": "97a6…"
}
```

Codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, `BAD_REQUEST`, `RATE_LIMITED`, `INTERNAL_ERROR`.

---

## Auth

Every `/api/v1/roles*` and `/api/v1/users*` request requires:

```
Authorization: Bearer <API_TOKEN>
```

Token comparison uses `crypto.timingSafeEqual` to avoid timing side-channels.

---

## Tests

```bash
npm test
```

24 tests across 4 files: services in isolation (unit) and the full Express pipeline via Supertest (integration), including auth failure paths, validation, conflicts, cascading deletes and the `/status` snapshot. Runs in well under a second.

---

## Deploy on Railway

1. Push this repo to GitHub.
2. In Railway: **New project → Deploy from GitHub → roles-api**.
3. Set env vars in the Railway dashboard:
   - `API_TOKEN` (≥ 16 chars, generate one: `openssl rand -hex 24`)
   - `CORS_ORIGIN` (your frontend URL)
   - `NODE_ENV=production`
4. Railway will detect [`railway.json`](railway.json) and build from the Dockerfile. The healthcheck path is `/api/v1/healthz`.
5. Confirm the deploy: open `/docs` on the public domain.

---

## License

MIT.
