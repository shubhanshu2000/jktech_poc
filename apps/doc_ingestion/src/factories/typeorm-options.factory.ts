import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeORMFactory implements TypeOrmOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const host = this.config.get('database.host');
    const port = this.config.get('database.port');
    const user = this.config.get('database.user');
    const password = this.config.get('database.password');
    const dbName = this.config.get('database.dbName');

    return {
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      type: 'postgres',
      host,
      port,
      username: user,
      password,
      database: dbName,
      autoLoadEntities: true,
    };
  }
}
