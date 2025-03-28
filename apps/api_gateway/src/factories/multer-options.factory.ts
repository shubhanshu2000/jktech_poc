import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from "@nestjs/platform-express";

@Injectable()
export class MulterAsyncOptionsFactory implements MulterOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMulterOptions(): MulterModuleOptions {
    return {
      dest: this.configService.get("upload.path"),
      limits: {
        fileSize: this.configService.get("upload.maxFileSize"),
      },
    };
  }
}
