export interface Assignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string | null;
}

export interface NewAssignmentInput {
  userId: string;
  roleId: string;
  assignedBy?: string | null;
}
