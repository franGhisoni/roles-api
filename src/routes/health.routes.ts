import { Router } from 'express';
import type { HealthController } from '@/controllers/health.controller.js';
import { asyncHandler } from '@/utils/async-handler.js';

export function healthRoutes(controller: HealthController): Router {
  const router = Router();
  router.get('/healthz', controller.liveness);
  router.get('/readyz', asyncHandler(controller.readiness));
  router.get('/status', asyncHandler(controller.status));
  return router;
}
