import { pinoHttp } from 'pino-http';
import type { RequestHandler } from 'express';
import { logger } from '@/config/logger.js';

export function requestLogger(): RequestHandler {
  return pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) =>
      `${req.method} ${req.url} → ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${req.url} → ${res.statusCode}: ${err.message}`,
    genReqId: (req) => (req as { id?: string }).id ?? 'unknown',
    serializers: {
      req: (req: { id?: string; method?: string; url?: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
    },
  }) as unknown as RequestHandler;
}
