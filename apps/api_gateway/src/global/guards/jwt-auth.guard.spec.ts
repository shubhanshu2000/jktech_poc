import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { TokenBlacklistGuard } from "./token-blacklist.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AuthGuard } from "@nestjs/passport";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let tokenBlacklistGuard: TokenBlacklistGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    // Create mock TokenBlacklistGuard
    const mockTokenBlacklistGuard = {
      canActivate: jest.fn().mockResolvedValue(true),
    };

    // Create mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnThis(),
      getRequest: jest.fn().mockReturnThis(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        JwtService,
        Reflector,
        {
          provide: TokenBlacklistGuard,
          useValue: mockTokenBlacklistGuard,
        },
      ],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
    tokenBlacklistGuard =
      moduleRef.get<TokenBlacklistGuard>(TokenBlacklistGuard);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should check token blacklist and validate JWT", async () => {
      // Mock the parent AuthGuard's canActivate method
      jest
        .spyOn(AuthGuard("jwt").prototype, "canActivate")
        .mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      // Verify TokenBlacklistGuard.canActivate was called
      expect(tokenBlacklistGuard.canActivate).toHaveBeenCalledWith(
        mockExecutionContext
      );
      // Verify the result is true
      expect(result).toBe(true);
    });

    it("should throw error if token is blacklisted", async () => {
      // Mock TokenBlacklistGuard to reject
      jest
        .spyOn(tokenBlacklistGuard, "canActivate")
        .mockRejectedValue(new Error("Token is blacklisted"));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        "Token is blacklisted"
      );
    });

    it("should throw error if JWT is invalid", async () => {
      // Mock TokenBlacklistGuard to pass but JWT validation to fail
      jest.spyOn(tokenBlacklistGuard, "canActivate").mockResolvedValue(true);
      jest
        .spyOn(AuthGuard("jwt").prototype, "canActivate")
        .mockResolvedValue(false);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(false);
    });
  });
});
