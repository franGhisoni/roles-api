import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { loadEnv } from '@/config/env.js';
import { requestId } from '@/middlewares/request-id.middleware.js';
import { requestLogger } from '@/middlewares/request-logger.middleware.js';
import { errorHandler, notFoundHandler } from '@/middlewares/error-handler.middleware.js';
import { buildApiRouter } from '@/routes/index.js';
import { mountSwagger } from '@/docs/swagger.js';
import type { Container } from '@/container/container.js';

export interface AppOptions {
  container: Container;
  trustProxy?: boolean;
}

export function createApp({ container, trustProxy = true }: AppOptions): Express {
  const env = loadEnv();
  const app = express();

  if (trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ contentSecurityPolicy: false }) as RequestHandler);
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: false,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  app.use(requestId());
  app.use(express.json({ limit: '1mb' }) as RequestHandler);
  app.use(requestLogger());

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: { code: 'RATE_LIMITED', message: 'Too many requests' },
    },
  }) as RequestHandler;
  app.use('/api', limiter);

  mountSwagger(app, '/docs');

  app.get('/', (_req, res) => {
    res.json({
      name: 'roles-api',
      version: '1.0.0',
      docs: '/docs',
      openapi: '/docs.json',
      health: '/api/v1/healthz',
      status: '/api/v1/status',
    });
  });

  app.use('/api/v1', buildApiRouter(container, { apiToken: env.API_TOKEN }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
