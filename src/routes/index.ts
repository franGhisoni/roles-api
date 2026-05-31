import { Router } from 'express';
import type { Container } from '@/container/container.js';
import { bearerAuth } from '@/middlewares/auth.middleware.js';
import { RoleController } from '@/controllers/role.controller.js';
import { UserController } from '@/controllers/user.controller.js';
import { AssignmentController } from '@/controllers/assignment.controller.js';
import { HealthController } from '@/controllers/health.controller.js';
import { roleRoutes } from '@/routes/role.routes.js';
import { userRoutes } from '@/routes/user.routes.js';
import { healthRoutes } from '@/routes/health.routes.js';

export interface BuildRoutesOptions {
  apiToken: string;
}

export function buildApiRouter(
  container: Container,
  options: BuildRoutesOptions,
): Router {
  const router = Router();

  const health = new HealthController(container);
  router.use('/', healthRoutes(health));

  const auth = bearerAuth(options.apiToken);

  const roles = new RoleController(container.services.role);
  const users = new UserController(container.services.user, container.services.assignment);
  const assignments = new AssignmentController(container.services.assignment);

  router.use('/roles', auth, roleRoutes(roles));
  router.use('/users', auth, userRoutes(users, assignments));

  return router;
}
