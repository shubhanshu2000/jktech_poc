import { getConfig, AppEnv, parseIntSafe } from './configuration';

describe('getConfig', () => {
  beforeEach(() => {
    process.env.PORT = '4000';
    process.env.APP_ENV = 'dev';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.POSTGRES_USER = 'user';
    process.env.POSTGRES_PASSWORD = 'password';
    process.env.POSTGRES_DB = 'database';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_PASSWORD = 'redis_password';
  });

  it('should return the correct configuration when all environment variables are set', () => {
    const config = getConfig();
    expect(config).toEqual({
      port: 4000,
      appEnv: AppEnv.DEV,
      database: {
        host: 'localhost',
        port: 5432,
        user: 'user',
        password: 'password',
        dbName: 'database',
      },
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'redis_password',
      },
    });
  });

  it('should use default values when environment variables are not set', () => {
    delete process.env.PORT;
    delete process.env.JWT_EXPIRY;
    delete process.env.DB_PORT;
    delete process.env.REDIS_PORT;
    delete process.env.UPLOAD_MAX_FILE_SIZE;

    const config = getConfig();
    expect(config.port).toBe(3000);
    expect(config.database.port).toBe(5432);
    expect(config.redis.port).toBe(6379);
  });

  it('should handle missing optional environment variables', () => {
    delete process.env.REDIS_PASSWORD;

    const config = getConfig();
    expect(config.redis.password).toBeUndefined();
  });

  describe('parseIntSafe', () => {
    it('should return fallback when num is undefined', () => {
      expect(parseIntSafe(undefined, 10)).toEqual(10);
    });

    it('should use the given num', () => {
      expect(parseIntSafe('10', 10)).toEqual(10);
    });

    it('should give fallback if provided num evaluates to NaN', () => {
      expect(parseIntSafe('abc', 10)).toEqual(10);
    });
  });
});
