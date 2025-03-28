import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getConfig } from './app-config/configuration';
import { DbModule } from './db/db.module';
import { IngestionEntity } from './entities/ingestion.entity';
import { AppController } from './ingestion.controller';
import { AppService } from './ingestion.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [getConfig],
      envFilePath: ['../.env'],
    }),
    EventEmitterModule.forRoot({
      delimiter: '.',
      global: true,
      wildcard: true,
    }),
    DbModule,
    TypeOrmModule.forFeature([IngestionEntity]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
