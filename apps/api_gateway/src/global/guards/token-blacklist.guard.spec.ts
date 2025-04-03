import { Test, TestingModule } from "@nestjs/testing";
import { TokenBlacklistGuard } from "./token-blacklist.guard";
import { RedisService } from "src/services/redis/redis.service";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { createMock } from "@golevelup/ts-jest/lib/mocks";

describe("TokenBlacklistGuard", () => {
  let guard: TokenBlacklistGuard;
  let redisService: RedisService;

  // Mock request object creator
  const createMockRequest = (token?: string) => ({
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  });

  // Mock execution context creator
  const createMockContext = (request: any) => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  });

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistGuard,
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
      ],
    }).compile();

    // Get instances of guard and service
    guard = module.get<TokenBlacklistGuard>(TokenBlacklistGuard);
    redisService = module.get(RedisService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should throw UnauthorizedException when no token is provided", async () => {
    // Create a mock request without a token
    const request = createMockRequest();
    const context = createMockContext(request) as ExecutionContext;

    // Expect an UnauthorizedException to be thrown
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("Token not provided")
    );
  });

  it("should throw UnauthorizedException when token is blacklisted", async () => {
    // Create a mock request with a token
    const token = "test-token";
    const request = createMockRequest(token);
    const context = createMockContext(request) as ExecutionContext;

    // Mock Redis service to indicate token is blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(true);

    // Expect an UnauthorizedException to be thrown
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("Token has been revoked")
    );

    // Verify that isBlacklisted was called with the correct token
    expect(redisService.isBlacklisted).toHaveBeenCalledWith(token);
  });

  it("should return true when token is not blacklisted", async () => {
    // Create a mock request with a token
    const token = "valid-token";
    const request = createMockRequest(token);
    const context = createMockContext(request) as ExecutionContext;

    // Mock Redis service to indicate token is not blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(false);

    // Expect the method to return true
    const result = await guard.canActivate(context);

    // Assertions
    expect(result).toBe(true);
    expect(redisService.isBlacklisted).toHaveBeenCalledWith(token);
  });

  it("should extract token correctly from Authorization header", async () => {
    // Create a mock request with a token
    const token = "extraction-token";
    const request = createMockRequest(token);
    const context = createMockContext(request) as ExecutionContext;

    // Mock Redis service to indicate token is not blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(false);

    // Call canActivate
    await guard.canActivate(context);

    // Verify that isBlacklisted was called with the correct token
    expect(redisService.isBlacklisted).toHaveBeenCalledWith(token);
  });

  it("should return undefined when Authorization header is malformed", async () => {
    // Create a mock request with a malformed Authorization header
    const request = {
      headers: {
        authorization: "InvalidFormat",
      },
    };
    const context = createMockContext(request) as ExecutionContext;

    // Expect an UnauthorizedException to be thrown
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException("Token not provided")
    );
  });
});
