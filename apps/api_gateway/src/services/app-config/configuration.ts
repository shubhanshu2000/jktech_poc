export function parseIntSafe(num: string | undefined, fallback: number) {
  if (!num) return fallback;

  const isValidNum = !isNaN(parseInt(num, 10));

  return isValidNum ? parseInt(num) : fallback;
}

export const getConfig = (): AppConfig => {
  return {
    port: parseIntSafe(process.env.PORT, 3000),
    appEnv: process.env.APP_ENV as AppEnv,
    jwt: {
      expiry: process.env.JWT_EXPIRY ?? "2h",
      secret: process.env.JWT_SECRET as string,
    },
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
    upload: {
      path: process.env.UPLOAD_PATH as string,
      maxFileSize: parseIntSafe(process.env.UPLOAD_MAX_FILE_SIZE, 1024 * 1024),
    },
  };
};

export interface AppConfig {
  port: number;
  appEnv: AppEnv;
  database: DbConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  upload: UploadConfig;
}

export enum AppEnv {
  DEV = "dev",
  TEST = "test",
  PROD = "production",
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

export interface JwtConfig {
  expiry: string;
  secret: string;
}

export interface UploadConfig {
  path: string;
  maxFileSize: number;
}
