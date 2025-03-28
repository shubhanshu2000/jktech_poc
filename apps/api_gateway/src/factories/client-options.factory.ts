import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ClientProvider,
  ClientsModuleOptionsFactory,
  Transport,
} from "@nestjs/microservices";

@Injectable()
export class ClientOptionsFactory implements ClientsModuleOptionsFactory {
  constructor(private readonly config: ConfigService) {}

  createClientOptions(): ClientProvider {
    const host = this.config.get("redis.host");
    const port = this.config.get("redis.port");
    const password = this.config.get("redis.password");

    return {
      transport: Transport.REDIS,
      options: {
        host,
        port,
        password,
      },
    };
  }
}
