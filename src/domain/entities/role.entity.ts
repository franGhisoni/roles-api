export type RoleType = 'system' | 'custom';
export type RoleScope = 'global' | 'organization' | 'project';

export interface Role {
  id: string;
  name: string;
  description: string | null;
  type: RoleType;
  scope: RoleScope;
  createdAt: string;
  updatedAt: string;
}

export interface NewRoleInput {
  name: string;
  description?: string | null;
  type?: RoleType;
  scope?: RoleScope;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  type?: RoleType;
  scope?: RoleScope;
}
