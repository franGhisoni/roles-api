import type { Request, Response } from 'express';
import type { UserService } from '@/services/user.service.js';
import type { AssignmentService } from '@/services/assignment.service.js';

export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly assignments: AssignmentService,
  ) {}

  list = async (_req: Request, res: Response) => {
    const users = await this.users.list();
    res.json({ data: users, meta: { total: users.length } });
  };

  getById = async (req: Request, res: Response) => {
    const user = await this.users.getById(req.params.id as string);
    res.json({ data: user });
  };

  listRoles = async (req: Request, res: Response) => {
    const roles = await this.assignments.listUserRoles(req.params.userId as string);
    res.json({ data: roles, meta: { total: roles.length } });
  };
}
