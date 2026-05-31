import { z } from 'zod';

export const assignRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
  body: z.object({
    roleId: z.string().uuid('roleId must be a valid UUID'),
  }),
});

export const unassignRoleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
  }),
});

export const userRolesParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});
