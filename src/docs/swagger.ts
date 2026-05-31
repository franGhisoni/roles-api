import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from '@/docs/openapi.js';

export function mountSwagger(app: Express, path = '/docs') {
  app.get(`${path}.json`, (_req, res) => {
    res.json(openApiSpec);
  });
  app.use(
    path,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customSiteTitle: 'Roles API · Docs',
      customCss: '.topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 0,
      },
    }),
  );
}
