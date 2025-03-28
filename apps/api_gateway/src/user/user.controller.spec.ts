import { createMock } from "@golevelup/ts-jest";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CHECK_PERMISSIONS_KEY } from "src/global/tokens/check-permission.token";
import { mockUserEntity } from "./entities/__fixtures__/user-entity.fixture";
import { UserEntity } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { AuthService } from "src/services/auth/auth.service";
import { UserService } from "src/services/user/user.service";
import { PasswordService } from "src/services/password/password.service";
import { JwtService } from "src/services/jwt/jwt.service";

describe("UserController", () => {
  let controller: UserController;
  let authService: AuthService;
  let userService: UserService;
  let reflect: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        PasswordService,
        ConfigService,
        JwtService,
        Reflector,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {},
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    reflect = module.get<Reflector>(Reflector);
    controller = module.get<UserController>(UserController);
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register method", () => {
    it("should have auth for register", () => {
      const handlers = reflect.get(CHECK_PERMISSIONS_KEY, controller.register);
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBeInstanceOf(Function);

      expect(handlers[0]({ can: () => true })).toBeTruthy();
    });

    it("should register user", async () => {
      jest.spyOn(authService, "register").mockResolvedValue({
        ...mockUserEntity,
        token: "token",
      });

      expect(
        await controller.register({
          firstName: "firstName",
          lastName: "lastName",
          roleId: 1,
          email: "email",
          password: "p",
        })
      ).toStrictEqual({
        message: "User created",
        user: {
          id: 0,
          token: "token",
        },
      });
    });
  });

  describe("login method", () => {
    it("should login user", async () => {
      jest.spyOn(authService, "login").mockResolvedValue("mock-token");

      expect(
        await controller.login({
          email: "email",
          password: "p",
        })
      ).toStrictEqual({
        message: "Login successful",
        token: "mock-token",
      });
    });
  });

  it("should have auth for getUsers", () => {
    const handlers = reflect.get(CHECK_PERMISSIONS_KEY, controller.getUsers);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  describe("getUsers method", () => {
    it("should retrieve all users", async () => {
      const userServiceSpy = jest
        .spyOn(userService, "getAll")
        .mockResolvedValue([mockUserEntity]);

      expect(await controller.getUsers()).toStrictEqual({
        message: "Users retrieved successfully",
        users: [mockUserEntity],
      });
      expect(userServiceSpy).toHaveBeenCalledTimes(1);
    });
  });
});
