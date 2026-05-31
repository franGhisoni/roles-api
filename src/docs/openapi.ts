export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Roles API',
    version: '1.0.0',
    description:
      'REST API for managing roles and their assignment to users (RBAC).\n\n' +
      '**Auth:** every endpoint under `/roles` and `/users` requires a `Bearer <token>` header. ' +
      'Health and status endpoints are public.',
    contact: { name: 'roles-api', url: 'https://github.com/' },
    license: { name: 'MIT' },
  },
  servers: [
    { url: '/api/v1', description: 'Current host' },
  ],
  tags: [
    { name: 'Health', description: 'Service health, readiness and status' },
    { name: 'Roles', description: 'Role lifecycle' },
    { name: 'Users', description: 'Users and their role assignments' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'opaque',
        description: 'Static API token. Set via `API_TOKEN` env var.',
      },
    },
    schemas: {
      Role: {
        type: 'object',
        required: ['id', 'name', 'type', 'scope', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Editor' },
          description: { type: 'string', nullable: true, example: 'Can edit content' },
          type: { type: 'string', enum: ['system', 'custom'], example: 'custom' },
          scope: {
            type: 'string',
            enum: ['global', 'organization', 'project'],
            example: 'organization',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      NewRole: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60, example: 'Editor' },
          description: { type: 'string', nullable: true, maxLength: 500 },
          type: { type: 'string', enum: ['system', 'custom'], default: 'custom' },
          scope: {
            type: 'string',
            enum: ['global', 'organization', 'project'],
            default: 'global',
          },
        },
      },
      UpdateRole: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 60 },
          description: { type: 'string', nullable: true, maxLength: 500 },
          type: { type: 'string', enum: ['system', 'custom'] },
          scope: { type: 'string', enum: ['global', 'organization', 'project'] },
        },
      },
      User: {
        type: 'object',
        required: ['id', 'email', 'fullName', 'active', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri', nullable: true },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Assignment: {
        type: 'object',
        required: ['id', 'userId', 'roleId', 'assignedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          roleId: { type: 'string', format: 'uuid' },
          assignedBy: { type: 'string', nullable: true },
          assignedAt: { type: 'string', format: 'date-time' },
        },
      },
      AssignmentWithRole: {
        allOf: [
          { $ref: '#/components/schemas/Assignment' },
          {
            type: 'object',
            properties: { role: { $ref: '#/components/schemas/Role' } },
          },
        ],
      },
      AssignRoleRequest: {
        type: 'object',
        required: ['roleId'],
        properties: { roleId: { type: 'string', format: 'uuid' } },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: true },
            },
          },
          requestId: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      Status: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string' },
          version: { type: 'string' },
          env: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time' },
          now: { type: 'string', format: 'date-time' },
          uptime: {
            type: 'object',
            properties: {
              ms: { type: 'integer' },
              human: { type: 'string' },
            },
          },
          runtime: {
            type: 'object',
            properties: {
              node: { type: 'string' },
              platform: { type: 'string' },
              arch: { type: 'string' },
              pid: { type: 'integer' },
            },
          },
          memory: {
            type: 'object',
            properties: {
              rssMb: { type: 'number' },
              heapUsedMb: { type: 'number' },
              heapTotalMb: { type: 'number' },
            },
          },
          counts: {
            type: 'object',
            properties: {
              roles: { type: 'integer' },
              users: { type: 'integer' },
              assignments: { type: 'integer' },
            },
          },
        },
      },
    },
    parameters: {
      RoleId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid Bearer token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Conflict: {
        description: 'Conflicting state (e.g. duplicate name)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/healthz': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        security: [],
        responses: {
          '200': {
            description: 'Service alive',
            content: { 'application/json': { example: { status: 'ok' } } },
          },
        },
      },
    },
    '/readyz': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        security: [],
        responses: { '200': { description: 'Ready' } },
      },
    },
    '/status': {
      get: {
        tags: ['Health'],
        summary: 'Detailed runtime status (uptime, memory, counts)',
        security: [],
        responses: {
          '200': {
            description: 'Status snapshot',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Status' } },
            },
          },
        },
      },
    },
    '/roles': {
      get: {
        tags: ['Roles'],
        summary: 'List roles (paginated, searchable)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['system', 'custom'] } },
          {
            name: 'scope',
            in: 'query',
            schema: { type: 'string', enum: ['global', 'organization', 'project'] },
          },
        ],
        responses: {
          '200': {
            description: 'Roles page',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Role' } },
                    meta: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Roles'],
        summary: 'Create a role',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/NewRole' } } },
        },
        responses: {
          '201': {
            description: 'Created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': { $ref: '#/components/responses/Conflict' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/roles/{id}': {
      parameters: [{ $ref: '#/components/parameters/RoleId' }],
      get: {
        tags: ['Roles'],
        summary: 'Get role by id',
        responses: {
          '200': {
            description: 'Role',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Roles'],
        summary: 'Update a role',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateRole' } } },
        },
        responses: {
          '200': {
            description: 'Updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Role' } } },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Roles'],
        summary: 'Delete a role (custom roles only)',
        responses: {
          '204': { description: 'Deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        responses: {
          '200': {
            description: 'Users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Users'],
        summary: 'Get user by id',
        responses: {
          '200': {
            description: 'User',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/users/{userId}/roles': {
      parameters: [{ $ref: '#/components/parameters/UserId' }],
      get: {
        tags: ['Users'],
        summary: 'List the roles assigned to a user',
        responses: {
          '200': {
            description: 'Assignments with embedded role',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AssignmentWithRole' },
                    },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Assign a role to a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignRoleRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Assignment created',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Assignment' } },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/users/{userId}/roles/{roleId}': {
      parameters: [
        { $ref: '#/components/parameters/UserId' },
        { name: 'roleId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      delete: {
        tags: ['Users'],
        summary: 'Remove a role assignment from a user',
        responses: {
          '204': { description: 'Removed' },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
} as const;
