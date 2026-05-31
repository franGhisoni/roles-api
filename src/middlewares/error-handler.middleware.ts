import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/domain/errors/app-error.js';
import { logger } from '@/config/logger.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
    requestId: req.id,
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.id }, 'AppError 5xx');
    } else {
      logger.warn(
        { code: err.code, message: err.message, requestId: req.id },
        'AppError',
      );
    }
    res.status(err.statusCode).json({
      error: err.toJSON(),
      requestId: req.id,
    });
    return;
  }

  if (err instanceof ZodError) {
    const validation = new ValidationError('Request validation failed', {
      issues: err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    });
    res.status(validation.statusCode).json({
      error: validation.toJSON(),
      requestId: req.id,
    });
    return;
  }

  logger.error({ err, requestId: req.id }, 'Unhandled error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId: req.id,
  });
}
