import type { Request, Response } from 'express';
import type { RoleService } from '@/services/role.service.js';
import type { ListRolesQuery } from '@/schemas/role.schema.js';

export class RoleController {
  constructor(private readonly service: RoleService) {}

  create = async (req: Request, res: Response) => {
    const role = await this.service.create(req.body);
    res.status(201).json({ data: role });
  };

  update = async (req: Request, res: Response) => {
    const role = await this.service.update(req.params.id as string, req.body);
    res.json({ data: role });
  };

  getById = async (req: Request, res: Response) => {
    const role = await this.service.getById(req.params.id as string);
    res.json({ data: role });
  };

  list = async (req: Request, res: Response) => {
    const q = req.query as unknown as ListRolesQuery;
    const result = await this.service.list({
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
      type: q.type,
      scope: q.scope,
    });
    res.json({
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
      },
    });
  };

  delete = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.status(204).send();
  };
}
