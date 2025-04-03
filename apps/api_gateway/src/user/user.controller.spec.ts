import { Test, TestingModule } from "@nestjs/testing";
import { UserController } from "./user.controller";
import { AuthService } from "src/services/auth/auth.service";
import { UserService } from "src/services/user/user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { CaslAbilityFactory } from "src/global/modules/casl/cals-ability.factory";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { JwtAuthGuard } from "../global/guards/jwt-auth.guard";
import { Action, Permissions } from "src/types/permissions";
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";

describe("UserController", () => {
  let controller: UserController;
  let authService: AuthService;
  let userService: UserService;
  let caslAbilityFactory: CaslAbilityFactory;
  let permissionGuard: PermissionGuard;
  let reflector: Reflector;

  // Mock ability instance
  const mockAbility = {
    can: jest.fn().mockReturnValue(true),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  const mockUserService = {
    getAll: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<UserEntity>;

  const mockCaslAbilityFactory = {
    createForUser: jest.fn().mockReturnValue(mockAbility),
    userRepository: mockUserRepository,
  } as unknown as CaslAbilityFactory;

  const mockClsService = {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    als: {},
    run: jest.fn(),
    enter: jest.fn(),
    exit: jest.fn(),
    setIfUndefined: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getId: jest.fn(),
    isActive: jest.fn(),
    middleware: jest.fn(),
    getValue: jest.fn(),
    setValue: jest.fn(),
  } as unknown as ClsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    reflector = new Reflector();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CaslAbilityFactory,
          useValue: mockCaslAbilityFactory,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        Reflector,
        {
          provide: PermissionGuard,
          useFactory: () =>
            new PermissionGuard(
              reflector,
              mockCaslAbilityFactory,
              mockClsService
            ),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    caslAbilityFactory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
    permissionGuard = module.get<PermissionGuard>(PermissionGuard);

    // Setup default successful responses
    mockAuthService.register.mockResolvedValue({ id: 1, token: "mock-token" });
    mockAuthService.login.mockResolvedValue("mock-token");
    mockAuthService.logout.mockResolvedValue(undefined);
    mockUserService.getAll.mockResolvedValue([
      { id: 1, email: "test@test.com" },
    ]);
    (mockClsService.get as jest.Mock).mockReturnValue({ id: 1 });
  });

  describe("register", () => {
    const createUserDto: CreateUserDto = {
      firstName: "John",
      lastName: "Doe",
      email: "test@test.com",
      password: "password123",
      roleId: 1,
    };

    it("should create a new user and return user data with token", async () => {
      const mockNewUser = {
        id: 1,
        token: "mock-token",
      };

      mockAuthService.register.mockResolvedValue(mockNewUser);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({
        message: "User created",
        user: {
          id: mockNewUser.id,
          token: mockNewUser.token,
        },
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });

    it("should handle registration with minimal required fields", async () => {
      const minimalUserDto: CreateUserDto = {
        email: "test@test.com",
        password: "password123",
        roleId: 1,
        firstName: "",
        lastName: "",
      };

      const mockNewUser = { id: 1, token: "mock-token" };
      mockAuthService.register.mockResolvedValue(mockNewUser);

      const result = await controller.register(minimalUserDto);
      expect(result).toEqual({
        message: "User created",
        user: {
          id: mockNewUser.id,
          token: mockNewUser.token,
        },
      });
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@test.com",
      password: "password123",
    };

    it("should login user and return token", async () => {
      const mockToken = "mock-token";
      mockAuthService.login.mockResolvedValue(mockToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        message: "Login successful",
        token: mockToken,
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it("should handle login errors", async () => {
      mockAuthService.login.mockRejectedValue(new Error("Invalid credentials"));
      await expect(controller.login(loginDto)).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("logout", () => {
    it("should logout user successfully", async () => {
      const mockRequest = {
        headers: {
          authorization: "Bearer mock-token",
        },
      };

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({
        message: "Logged out successfully",
      });
      expect(mockAuthService.logout).toHaveBeenCalledWith("mock-token");
    });

    it("should handle missing authorization header", async () => {
      const mockRequest = {
        headers: {},
      };

      const result = await controller.logout(mockRequest);
      expect(mockAuthService.logout).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        message: "Logged out successfully",
      });
    });

    it("should handle malformed authorization header", async () => {
      const mockRequest = {
        headers: {
          authorization: "malformed-token",
        },
      };

      const result = await controller.logout(mockRequest);
      expect(mockAuthService.logout).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({
        message: "Logged out successfully",
      });
    });
  });

  describe("getUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { id: 1, email: "user1@test.com" },
        { id: 2, email: "user2@test.com" },
      ];

      mockUserService.getAll.mockResolvedValue(mockUsers);

      const result = await controller.getUsers();

      expect(result).toEqual({
        message: "Users retrieved successfully",
        users: mockUsers,
      });
      expect(mockUserService.getAll).toHaveBeenCalled();
    });

    it("should handle empty user list", async () => {
      mockUserService.getAll.mockResolvedValue([]);

      const result = await controller.getUsers();
      expect(result).toEqual({
        message: "Users retrieved successfully",
        users: [],
      });
    });
  });

  describe("permission checks", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should check permissions for register endpoint", async () => {
      const mockExecutionContext = {
        getHandler: () => UserController.prototype.register,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
          }),
        }),
        getClass: () => UserController,
      };

      const mockHandler = (ability: {
        can: (action: Action, subject: Permissions) => boolean;
      }) => ability.can(Action.WRITE, "User");

      (reflector.get as jest.Mock) = jest.fn().mockReturnValue(mockHandler);

      await permissionGuard.canActivate(mockExecutionContext as any);

      expect(mockAbility.can).toHaveBeenCalledWith(Action.WRITE, "User");
    });

    it("should check permissions for getUsers endpoint", async () => {
      const mockExecutionContext = {
        getHandler: () => UserController.prototype.getUsers,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
          }),
        }),
        getClass: () => UserController,
      };

      const mockHandler = (ability: {
        can: (action: Action, subject: Permissions) => boolean;
      }) => ability.can(Action.READ, "User");

      (reflector.get as jest.Mock) = jest.fn().mockReturnValue(mockHandler);

      await permissionGuard.canActivate(mockExecutionContext as any);

      expect(mockAbility.can).toHaveBeenCalledWith(Action.READ, "User");
    });

    it("should deny access when permissions are not met", async () => {
      mockAbility.can.mockReturnValue(false);

      const mockExecutionContext = {
        getHandler: () => UserController.prototype.getUsers,
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 1 },
          }),
        }),
        getClass: () => UserController,
      };

      const mockHandler = (ability: {
        can: (action: Action, subject: Permissions) => boolean;
      }) => ability.can(Action.READ, "User");

      (reflector.get as jest.Mock) = jest.fn().mockReturnValue(mockHandler);

      const result = await permissionGuard.canActivate(
        mockExecutionContext as any
      );
      expect(result).toBeFalsy();
    });
  });

  describe("error handling", () => {
    it("should handle registration validation errors", async () => {
      const invalidUserDto = {
        email: "invalid-email",
        password: "short",
        roleId: 0,
      } as CreateUserDto;

      mockAuthService.register.mockRejectedValue(
        new Error("Validation failed")
      );
      await expect(controller.register(invalidUserDto)).rejects.toThrow(
        "Validation failed"
      );
    });

    it("should handle database connection errors", async () => {
      mockUserService.getAll.mockRejectedValue(
        new Error("Database connection failed")
      );
      await expect(controller.getUsers()).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle logout errors", async () => {
      const mockRequest = {
        headers: {
          authorization: "Bearer mock-token",
        },
      };

      mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));
      await expect(controller.logout(mockRequest)).rejects.toThrow(
        "Logout failed"
      );
    });
  });
});
