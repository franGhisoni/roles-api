import type { Request, Response } from 'express';
import type { AssignmentService } from '@/services/assignment.service.js';

export class AssignmentController {
  constructor(private readonly service: AssignmentService) {}

  assign = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const roleId = (req.body as { roleId: string }).roleId;
    const actor = req.auth?.token ? 'api-token' : null;
    const assignment = await this.service.assignRoleToUser(userId, roleId, actor);
    res.status(201).json({ data: assignment });
  };

  unassign = async (req: Request, res: Response) => {
    const userId = req.params.userId as string;
    const roleId = req.params.roleId as string;
    await this.service.removeRoleFromUser(userId, roleId);
    res.status(204).send();
  };
}
