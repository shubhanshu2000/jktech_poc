import { createMock } from "@golevelup/ts-jest/lib/mocks";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { mockUserEntity } from "../../user/entities/__fixtures__/user-entity.fixture";
import { UserEntity } from "../../user/entities/user.entity";
import { JwtService } from "../jwt/jwt.service";
import { PasswordService } from "../password/password.service";
import { RedisService } from "../redis/redis.service";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { CreateUserDto } from "../../user/dto/create-user.dto";
import { LoginDto } from "../../user/dto/login.dto";

jest.setTimeout(10000);

describe("AuthService", () => {
  let authService: AuthService;
  let userService: UserService;
  let redisService: RedisService;
  let configService: ConfigService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        PasswordService,
        ConfigService,
        JwtService,
        RedisService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(authService).toBeDefined();
  });

  describe("register", () => {
    const registerDto: CreateUserDto = {
      roleId: 1,
      email: "test@example.com",
      password: "password123",
      lastName: "Doe",
      firstName: "John",
    };

    it("should check for user existence", async () => {
      const existSpy = jest
        .spyOn(userService, "isUserExists")
        .mockResolvedValue(mockUserEntity);
      const createSpy = jest.spyOn(userService, "createUser");

      await expect(authService.register(registerDto)).rejects.toThrow(
        new HttpException("User already exists", 400)
      );

      expect(existSpy).toHaveBeenCalledWith("test@example.com");
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("should create new user", async () => {
      const existSpy = jest
        .spyOn(userService, "isUserExists")
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(userService, "createUser")
        .mockResolvedValue({ ...mockUserEntity, ...registerDto });
      const tokenSpy = jest
        .spyOn(userService, "getUserToken")
        .mockReturnValue("mock-token");

      const result = await authService.register(registerDto);

      expect(result).toEqual({
        ...mockUserEntity,
        ...registerDto,
        token: "mock-token",
      });
      expect(existSpy).toHaveBeenCalledWith("test@example.com");
      expect(createSpy).toHaveBeenCalledWith(registerDto);
      expect(tokenSpy).toHaveBeenCalledWith(
        expect.objectContaining(registerDto)
      );
    });

    it("should handle database errors", async () => {
      jest.spyOn(userService, "isUserExists").mockResolvedValue(null);
      jest
        .spyOn(userService, "createUser")
        .mockRejectedValue(new Error("Database error"));

      await expect(authService.register(registerDto)).rejects.toThrow(
        "Database error"
      );
    });

    it("should handle partial user data during registration", async () => {
      const partialRegisterDto = {
        email: "partial@example.com",
        password: "password123",
      };

      const existSpy = jest
        .spyOn(userService, "isUserExists")
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(userService, "createUser")
        .mockResolvedValue({
          ...mockUserEntity,
          email: partialRegisterDto.email,
        });
      const tokenSpy = jest
        .spyOn(userService, "getUserToken")
        .mockReturnValue("mock-token");

      const result = await authService.register(partialRegisterDto as any);

      expect(result).toEqual({
        ...mockUserEntity,
        email: partialRegisterDto.email,
        token: "mock-token",
      });
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("should check user existence", async () => {
      const existSpy = jest
        .spyOn(userService, "isUserExists")
        .mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow("Login failed");
      expect(existSpy).toHaveBeenCalledWith("test@example.com");
    });

    it("should verify password", async () => {
      const existSpy = jest
        .spyOn(userService, "isUserExists")
        .mockResolvedValue(mockUserEntity);
      const passwordSpy = jest
        .spyOn(userService, "checkUserPassword")
        .mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        "Incorrect password"
      );

      expect(existSpy).toHaveBeenCalledWith("test@example.com");
      expect(passwordSpy).toHaveBeenCalledWith(mockUserEntity, "password123");
    });

    it("should return token on success", async () => {
      jest.spyOn(userService, "isUserExists").mockResolvedValue(mockUserEntity);
      jest.spyOn(userService, "checkUserPassword").mockResolvedValue(true);
      jest.spyOn(userService, "getUserToken").mockReturnValue("mock-token");

      const result = await authService.login(loginDto);

      expect(result).toBe("mock-token");
    });

    it("should handle empty credentials", async () => {
      const emptyLoginDto = {
        email: "",
        password: "",
      };

      await expect(authService.login(emptyLoginDto)).rejects.toThrow(
        "Login failed"
      );
    });

    it("should handle login with trimmed credentials", async () => {
      const loginDto = {
        email: "  test@example.com  ",
        password: "  password123  ",
      };

      jest.spyOn(userService, "isUserExists").mockResolvedValue(mockUserEntity);
      jest.spyOn(userService, "checkUserPassword").mockResolvedValue(true);
      jest.spyOn(userService, "getUserToken").mockReturnValue("mock-token");

      const result = await authService.login(loginDto);

      expect(result).toBe("mock-token");
    });
  });

  describe("logout", () => {
    it("should blacklist token", async () => {
      const token = "valid-token";
      jest.spyOn(configService, "get").mockReturnValue("2h");
      const blacklistSpy = jest
        .spyOn(redisService, "addToBlacklist")
        .mockResolvedValue();

      await authService.logout(token);

      expect(configService.get).toHaveBeenCalledWith("jwt.expiry");
      expect(blacklistSpy).toHaveBeenCalledWith(token, 7200);
    }, 10000);

    it("should handle redis errors", async () => {
      const token = "valid-token";
      jest.spyOn(configService, "get").mockReturnValue("2h");
      jest
        .spyOn(redisService, "addToBlacklist")
        .mockRejectedValue(new Error("Redis error"));

      await expect(authService.logout(token)).rejects.toThrow("Logout failed");
    }, 10000);

    it("should handle empty token", async () => {
      const token = "";
      jest.spyOn(configService, "get").mockReturnValue("2h");
      jest
        .spyOn(redisService, "addToBlacklist")
        .mockRejectedValue(new Error("Invalid token"));

      await expect(authService.logout(token)).rejects.toThrow("Logout failed");
    }, 10000);

    it("should handle undefined config in logout", async () => {
      jest.spyOn(configService, "get").mockReturnValue(undefined);

      const token = "valid-token";
      const blacklistSpy = jest
        .spyOn(redisService, "addToBlacklist")
        .mockResolvedValue();

      await authService.logout(token);

      expect(configService.get).toHaveBeenCalledWith("jwt.expiry");
      expect(blacklistSpy).toHaveBeenCalledWith(token, 7200); // Default expiry
    });

    it("should handle null config in logout", async () => {
      jest.spyOn(configService, "get").mockReturnValue(null);

      const token = "valid-token";
      const blacklistSpy = jest
        .spyOn(redisService, "addToBlacklist")
        .mockResolvedValue();

      await authService.logout(token);

      expect(configService.get).toHaveBeenCalledWith("jwt.expiry");
      expect(blacklistSpy).toHaveBeenCalledWith(token, 7200); // Default expiry
    });
  });

  describe("parseExpiryToSeconds", () => {
    const validCases: [string, number][] = [
      ["2h", 7200],
      ["1d", 86400],
      ["30m", 1800],
      ["45s", 45],
    ];

    const additionalCases: [string | null | undefined, number][] = [
      ["2.5h", 7200],
      ["1.5d", 129600],
      ["30.5m", 1830],
      ["45.7s", 45],
    ];

    it.each(validCases)(
      "should parse valid input: %s to %i seconds",
      (input, expected) => {
        const result = (authService as any).parseExpiryToSeconds(input);
        expect(result).toBe(expected);
      }
    );

    it.each(additionalCases)(
      "should handle additional input formats: %s",
      (input, expected) => {
        const result = (authService as any).parseExpiryToSeconds(input);
        expect(result).toBe(expected);
      }
    );

    const invalidCases: [string | null | undefined][] = [
      [""],
      ["invalid"],
      [null],
      [undefined],
      ["h"],
      ["d"],
      ["m"],
      ["s"],
      ["123"],
      ["-1h"],
      ["2x"],
      ["0h"],
    ];

    it.each(invalidCases)("should handle invalid input: %s", (input) => {
      const result = (authService as any).parseExpiryToSeconds(input);
      expect(result).toBe(7200);
    });

    it("should handle parsing errors gracefully", () => {
      // Simulate a parsing error
      const mockParseInt = jest
        .spyOn(global, "parseInt")
        .mockImplementation(() => {
          throw new Error("Parsing error");
        });

      const result = (authService as any).parseExpiryToSeconds("2h");
      expect(result).toBe(7200);

      mockParseInt.mockRestore();
    });
  });

  describe("failLogin", () => {
    it("should throw with custom message", () => {
      const message = "Custom error";
      expect(() => {
        (authService as any).failLogin(message);
      }).toThrow(new HttpException(message, 400));
    });

    it("should throw with default message", () => {
      expect(() => {
        (authService as any).failLogin();
      }).toThrow(new HttpException("Login failed", 400));
    });
  });
});
