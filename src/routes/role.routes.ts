import { Router } from 'express';
import { asyncHandler } from '@/utils/async-handler.js';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  createRoleSchema,
  listRolesQuerySchema,
  updateRoleSchema,
} from '@/schemas/role.schema.js';
import { idParamSchema } from '@/schemas/common.schema.js';
import { z } from 'zod';
import type { RoleController } from '@/controllers/role.controller.js';

const idParamWrapper = z.object({ params: idParamSchema });

export function roleRoutes(controller: RoleController): Router {
  const router = Router();

  router.get('/', validate(listRolesQuerySchema), asyncHandler(controller.list));
  router.get('/:id', validate(idParamWrapper), asyncHandler(controller.getById));
  router.post('/', validate(createRoleSchema), asyncHandler(controller.create));
  router.patch(
    '/:id',
    validate(z.object({ params: idParamSchema, body: updateRoleSchema.shape.body })),
    asyncHandler(controller.update),
  );
  router.delete('/:id', validate(idParamWrapper), asyncHandler(controller.delete));

  return router;
}
