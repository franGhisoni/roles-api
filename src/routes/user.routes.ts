import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/utils/async-handler.js';
import { validate } from '@/middlewares/validate.middleware.js';
import { idParamSchema } from '@/schemas/common.schema.js';
import {
  assignRoleSchema,
  unassignRoleSchema,
  userRolesParamsSchema,
} from '@/schemas/assignment.schema.js';
import type { UserController } from '@/controllers/user.controller.js';
import type { AssignmentController } from '@/controllers/assignment.controller.js';

export function userRoutes(
  userController: UserController,
  assignmentController: AssignmentController,
): Router {
  const router = Router();

  router.get('/', asyncHandler(userController.list));
  router.get(
    '/:id',
    validate(z.object({ params: idParamSchema })),
    asyncHandler(userController.getById),
  );

  router.get(
    '/:userId/roles',
    validate(userRolesParamsSchema),
    asyncHandler(userController.listRoles),
  );
  router.post(
    '/:userId/roles',
    validate(assignRoleSchema),
    asyncHandler(assignmentController.assign),
  );
  router.delete(
    '/:userId/roles/:roleId',
    validate(unassignRoleSchema),
    asyncHandler(assignmentController.unassign),
  );

  return router;
}
