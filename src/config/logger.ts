import pino from 'pino';
import { loadEnv } from '@/config/env.js';

const env = loadEnv();

const isPretty = env.NODE_ENV !== 'production';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'authorization', '*.token', '*.password'],
    censor: '[REDACTED]',
  },
  ...(isPretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
