import { z } from 'zod';

export const roleTypeSchema = z.enum(['system', 'custom']);
export const roleScopeSchema = z.enum(['global', 'organization', 'project']);

const ROLE_NAME_REGEX = /^[a-zA-Z0-9 _-]+$/;

export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'name must be at least 2 characters')
      .max(60, 'name must be at most 60 characters')
      .regex(ROLE_NAME_REGEX, 'name can only contain letters, numbers, spaces, _ and -'),
    description: z.string().trim().max(500).nullish(),
    type: roleTypeSchema.optional().default('custom'),
    scope: roleScopeSchema.optional().default('global'),
  }),
});

export const updateRoleSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(60)
        .regex(ROLE_NAME_REGEX)
        .optional(),
      description: z.string().trim().max(500).nullish(),
      type: roleTypeSchema.optional(),
      scope: roleScopeSchema.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field is required to update',
    }),
});

export const listRolesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    type: roleTypeSchema.optional(),
    scope: roleScopeSchema.optional(),
  }),
});

export type CreateRoleBody = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>['body'];
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>['query'];
