import type { Request, Response } from 'express';
import type { Container } from '@/container/container.js';

const startedAt = Date.now();

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export class HealthController {
  constructor(private readonly container: Container) {}

  liveness = (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  };

  readiness = async (_req: Request, res: Response) => {
    res.json({
      status: 'ready',
      checks: { repositories: 'ok' },
    });
  };

  status = async (_req: Request, res: Response) => {
    const mem = process.memoryUsage();
    const [roles, users, assignments] = await Promise.all([
      this.container.repositories.roles.count(),
      this.container.repositories.users.count(),
      this.container.repositories.assignments.count(),
    ]);
    const uptimeMs = Date.now() - startedAt;
    res.json({
      status: 'ok',
      service: 'roles-api',
      version: process.env.npm_package_version ?? '1.0.0',
      env: process.env.NODE_ENV ?? 'development',
      startedAt: new Date(startedAt).toISOString(),
      now: new Date().toISOString(),
      uptime: {
        ms: uptimeMs,
        human: formatUptime(uptimeMs),
      },
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      },
      memory: {
        rssMb: +(mem.rss / 1024 / 1024).toFixed(2),
        heapUsedMb: +(mem.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMb: +(mem.heapTotal / 1024 / 1024).toFixed(2),
      },
      counts: { roles, users, assignments },
    });
  };
}
