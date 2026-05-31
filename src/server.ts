import { loadEnv } from '@/config/env.js';
import { logger } from '@/config/logger.js';
import { buildContainer } from '@/container/container.js';
import { createApp } from '@/app.js';
import { seed } from '@/seed/seed.js';

async function main() {
  const env = loadEnv();
  const container = buildContainer({
    driver: env.DATABASE_DRIVER,
    databaseUrl: env.DATABASE_URL,
  });

  if (env.SEED_DATA) {
    await seed(container);
    logger.info(
      {
        driver: env.DATABASE_DRIVER,
        roles: await container.repositories.roles.count(),
        users: await container.repositories.users.count(),
        assignments: await container.repositories.assignments.count(),
      },
      'Persistence ready',
    );
  }

  const app = createApp({ container });
  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      {
        url: `http://${env.HOST}:${env.PORT}`,
        docs: `http://${env.HOST}:${env.PORT}/docs`,
      },
      `roles-api ready on :${env.PORT}`,
    );
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    server.close(async (err) => {
      try {
        await container.shutdown();
      } catch (e) {
        logger.error({ e }, 'shutdown error');
      }
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
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
