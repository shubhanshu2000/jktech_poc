import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterAsyncOptionsFactory } from "src/factories/multer-options.factory";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { DocumentEntity } from "./entities/document.entity";

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterAsyncOptionsFactory,
    }),
    TypeOrmModule.forFeature([DocumentEntity]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
