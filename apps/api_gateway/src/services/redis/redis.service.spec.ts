import { Test, TestingModule } from "@nestjs/testing";
import { RedisService } from "./redis.service";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

describe("RedisService", () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

  // Define proper types for the config
  interface ConfigMap {
    "redis.host": string;
    "redis.port": number;
    "redis.password": string;
    [key: string]: string | number; // Add index signature
  }

  // Create a properly typed mock ConfigService
  class MockConfigService extends ConfigService {
    private readonly config: ConfigMap = {
      "redis.host": "localhost",
      "redis.port": 6379,
      "redis.password": "password",
    };

    get(key: string): string | number {
      return this.config[key];
    }
  }

  beforeEach(async () => {
    // Create mock Redis instance
    mockRedis = {
      set: jest.fn().mockResolvedValue("OK"),
      exists: jest.fn().mockResolvedValue(0),
      // Add other required Redis methods if needed
      disconnect: jest.fn(),
      quit: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedisService,
          useFactory: () => {
            const service = new RedisService(new MockConfigService());
            // @ts-ignore - Replace the Redis instance
            service.redis = mockRedis;
            return service;
          },
        },
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("addToBlacklist", () => {
    it("should add token to blacklist with expiration", async () => {
      const token = "test-token";
      const expiresIn = 3600;

      await service.addToBlacklist(token, expiresIn);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "bl_token:test-token",
        "blacklisted",
        "EX",
        expiresIn
      );
    });

    it("should handle Redis errors when adding to blacklist", async () => {
      mockRedis.set.mockRejectedValueOnce(new Error("Redis error"));

      await expect(service.addToBlacklist("test-token", 3600)).rejects.toThrow(
        "Redis error"
      );
    });
  });

  describe("isBlacklisted", () => {
    it("should return true for blacklisted token", async () => {
      mockRedis.exists.mockResolvedValueOnce(1);

      const result = await service.isBlacklisted("test-token");

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith("bl_token:test-token");
    });

    it("should return false for non-blacklisted token", async () => {
      mockRedis.exists.mockResolvedValueOnce(0);

      const result = await service.isBlacklisted("test-token");

      expect(result).toBe(false);
    });

    it("should handle Redis errors when checking blacklist", async () => {
      mockRedis.exists.mockRejectedValueOnce(new Error("Redis error"));

      await expect(service.isBlacklisted("test-token")).rejects.toThrow(
        "Redis error"
      );
    });
  });
});
