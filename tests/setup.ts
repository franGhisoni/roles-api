process.env.NODE_ENV = 'test';
process.env.API_TOKEN = process.env.API_TOKEN ?? 'integration-token-1234567890abcdef';
process.env.SEED_DATA = 'false';
process.env.LOG_LEVEL = 'silent';
process.env.RATE_LIMIT_MAX = '100000';
process.env.PORT = '0';
process.env.DATABASE_DRIVER = 'memory';
