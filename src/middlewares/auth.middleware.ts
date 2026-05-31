import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '@/domain/errors/app-error.js';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: { token: string };
  }
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function bearerAuth(expectedToken: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.header('authorization');
    if (!header) {
      return next(new UnauthorizedError('Missing Authorization header'));
    }
    const [scheme, token] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      return next(
        new UnauthorizedError('Authorization header must be "Bearer <token>"'),
      );
    }
    if (!safeEqual(token, expectedToken)) {
      return next(new UnauthorizedError('Invalid API token'));
    }
    req.auth = { token };
    return next();
  };
}
