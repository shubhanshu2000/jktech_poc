// src/services/redis/redis.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly keyPrefix = "bl_token:";

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get("redis.host"),
      port: this.configService.get("redis.port"),
      password: this.configService.get("redis.password"),
    });
  }

  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    await this.redis.set(
      `${this.keyPrefix}${token}`,
      "blacklisted",
      "EX",
      expiresIn
    );
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redis.exists(`${this.keyPrefix}${token}`);
    return exists === 1;
  }
}
