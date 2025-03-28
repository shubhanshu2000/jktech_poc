import { DataSource, DataSourceOptions } from 'typeorm';

import { getConfig } from './src/app-config/configuration';

const {
  database: { host, port, password, user, dbName },
} = getConfig();

console.log({ host, port, password, user, dbName });

const config: DataSourceOptions = {
  type: 'postgres',
  host,
  port,
  username: user,
  password,
  database: dbName,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/**/migrations/*.ts'],
  subscribers: ['src/**/subscribers/*.ts'],
};

const dataSource = new DataSource(config);

export default dataSource;
