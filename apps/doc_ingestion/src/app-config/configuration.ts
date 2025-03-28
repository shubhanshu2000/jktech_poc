export function parseIntSafe(num: string | undefined, fallback: number) {
  if (!num) return fallback;

  const isValidNum = !isNaN(parseInt(num, 10));

  return isValidNum ? parseInt(num) : fallback;
}

export const getConfig = (): AppConfig => {
  return {
    port: parseIntSafe(process.env.PORT, 3000),
    appEnv: process.env.APP_ENV as AppEnv,
    database: {
      host: process.env.DB_HOST as string,
      port: parseIntSafe(process.env.DB_PORT, 5432),
      user: process.env.POSTGRES_USER as string,
      password: process.env.POSTGRES_PASSWORD as string,
      dbName: process.env.POSTGRES_DB as string,
    },
    redis: {
      host: process.env.REDIS_HOST as string,
      port: parseIntSafe(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD as string,
    },
  };
};

export interface AppConfig {
  port: number;
  appEnv: AppEnv;
  database: DbConfig;
  redis: RedisConfig;
}

export enum AppEnv {
  DEV = 'dev',
  TEST = 'test',
  PROD = 'production',
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
}
