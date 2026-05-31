import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

export function requestId() {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header('x-request-id');
    const id = incoming && incoming.length <= 64 ? incoming : randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  };
}
