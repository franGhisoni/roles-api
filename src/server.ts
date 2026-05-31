import { loadEnv } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { buildContainer } from '@/container/container.js';
import { createApp } from '@/app.js';
import { seed } from '@/seed/seed.js';

async function main() {
  const env = loadEnv();
  const container = buildContainer();

  if (env.SEED_DATA) {
    await seed(container);
    logger.info(
      {
        roles: await container.repositories.roles.count(),
        users: await container.repositories.users.count(),
        assignments: await container.repositories.assignments.count(),
      },
      'Seeded in-memory data',
    );
  }

  const app = createApp({ container });
  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { url: `http://${env.HOST}:${env.PORT}`, docs: `http://${env.HOST}:${env.PORT}/docs` },
      `roles-api ready on :${env.PORT}`,
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    server.close((err) => {
      if (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
      }
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Forcing exit after 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

main().catch((err) => {
  // Fall back to console — logger may not be ready
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
