import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '@/domain/errors/app-error.js';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      return next(new ValidationError('Request validation failed', { issues }));
    }
    if (parsed.data.body) req.body = parsed.data.body;
    if (parsed.data.query) Object.assign(req.query, parsed.data.query);
    if (parsed.data.params) Object.assign(req.params, parsed.data.params);
    return next();
  };
}
