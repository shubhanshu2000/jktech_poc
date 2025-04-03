import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./jwt.strategy";
import { createMock } from "@golevelup/ts-jest/lib/mocks";
import { UserService } from "src/services/user/user.service";
import { RedisService } from "src/services/redis/redis.service";
import { ClsService } from "nestjs-cls";
import { ForbiddenException } from "@nestjs/common";
import { UserEntity } from "src/user/entities/user.entity";
import { RoleEntity } from "src/user/entities/role.entity";
import { RolePermissionEntity } from "src/user/entities/role-permission.entity";
import { PermissionEntity } from "src/user/entities/permission.entity";

describe("JWT Strategy", () => {
  let strategy: JwtStrategy;
  let userService: UserService;
  let redisService: RedisService;
  let clsService: ClsService;

  const payload = {
    email: "email",
    firstName: "fName",
    lastName: "Lname",
    id: "1",
  };

  // Create a mock permission entity
  const mockPermissionEntity: PermissionEntity = {
    id: 1,
    name: "test-permission",
    description: "Test permission description",
    rolePermissions: [], // Can be an empty array
  };

  // Create mock role permission entities
  const mockRolePermissionEntities: RolePermissionEntity[] = [
    {
      id: 1,
      roleId: 1,
      permissionId: 1,
      accessType: "read",
      role: {} as RoleEntity,
      permission: mockPermissionEntity,
    },
  ];

  // Create a mock role entity with all required properties
  const mockRoleEntity: RoleEntity = {
    id: 1,
    name: "test-role",
    users: [], // Can be an empty array
    rolePermissions: mockRolePermissionEntities,
  };

  // Create a complete mock user entity
  const mockUserEntity: UserEntity = {
    id: 1,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    roleId: 1,
    role: mockRoleEntity,
    passwordHash: "hashed-password",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: () => "secret" },
        },
        {
          provide: UserService,
          useValue: createMock<UserService>(),
        },
        {
          provide: RedisService,
          useValue: createMock<RedisService>(),
        },
        {
          provide: ClsService,
          useValue: createMock<ClsService>(),
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get(UserService);
    redisService = module.get(RedisService);
    clsService = module.get(ClsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(strategy).toBeDefined();
  });

  it("should return payload on validate", async () => {
    // Mock CLS service to return a token
    jest.spyOn(clsService, "get").mockReturnValue("test-token");

    // Mock Redis service to indicate token is not blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(false);

    // Mock user service to return user details
    jest.spyOn(userService, "isUserExists").mockResolvedValue(mockUserEntity);

    // Mock CLS set method
    const clsSetSpy = jest.spyOn(clsService, "set");

    // Validate the strategy
    const result = await strategy.validate(payload);

    // Assertions
    expect(clsService.get).toHaveBeenCalledWith("token");
    expect(redisService.isBlacklisted).toHaveBeenCalledWith("test-token");
    expect(userService.isUserExists).toHaveBeenCalledWith(payload.email);
    expect(clsSetSpy).toHaveBeenCalledWith("authUser", mockUserEntity);
    expect(result).toEqual(payload);
  });

  it("should throw ForbiddenException when token is blacklisted", async () => {
    // Mock CLS service to return a token
    jest.spyOn(clsService, "get").mockReturnValue("blacklisted-token");

    // Mock Redis service to indicate token is blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(true);

    // Expect ForbiddenException when token is blacklisted
    await expect(strategy.validate(payload)).rejects.toThrow(
      new ForbiddenException("Token has been revoked")
    );
  });

  it("should throw ForbiddenException on invalid user", async () => {
    // Mock CLS service to return a token
    jest.spyOn(clsService, "get").mockReturnValue("test-token");

    // Mock Redis service to indicate token is not blacklisted
    jest.spyOn(redisService, "isBlacklisted").mockResolvedValue(false);

    // Mock user service to return null (user not found)
    jest.spyOn(userService, "isUserExists").mockResolvedValue(null);

    // Expect ForbiddenException when user is invalid
    await expect(strategy.validate(payload)).rejects.toThrow(
      new ForbiddenException("Invalid user provided.")
    );
  });
});
