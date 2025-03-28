import { DataSource, DataSourceOptions } from "typeorm";
import { SeederOptions } from "typeorm-extension";
import { getConfig } from "./src/services/app-config/configuration";

const {
  database: { host, port, password, user, dbName },
} = getConfig();

const config: DataSourceOptions & SeederOptions = {
  type: "postgres",
  host,
  port,
  username: user,
  password,
  database: dbName,
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/**/migrations/*.ts"],
  seeds: ["src/**/seeds/*.ts"],
  subscribers: ["src/**/subscribers/*.ts"],
};

const dataSource = new DataSource(config);

export default dataSource;
