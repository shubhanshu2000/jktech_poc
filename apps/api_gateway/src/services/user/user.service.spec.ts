import { createMock } from "@golevelup/ts-jest";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { mockUserEntity } from "../../user/entities/__fixtures__/user-entity.fixture";
import { UserEntity } from "../../user/entities/user.entity";
import { JwtService } from "../jwt/jwt.service";
import { PasswordService } from "../password/password.service";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;
  let repo: Repository<UserEntity>;
  let jwtService: JwtService;
  let passwordService: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        ConfigService,
        PasswordService,
        JwtService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMock(),
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    jwtService = module.get(JwtService);
    service = module.get<UserService>(UserService);
    passwordService = module.get<PasswordService>(PasswordService);
    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should be able to check user existence", async () => {
    const findOneSpy = jest.spyOn(repo, "findOne").mockResolvedValue(null);

    expect(await service.isUserExists("mail")).toBe(null);
    expect(findOneSpy).toHaveBeenCalledWith({
      where: {
        email: "mail",
      },
    });
  });

  it("should be able to create user", async () => {
    const passwordSpy = jest
      .spyOn(passwordService, "generate")
      .mockResolvedValue("password-hash");
    const createSpy = jest
      .spyOn(repo, "create")
      .mockReturnValue(mockUserEntity as any);
    const saveSpy = jest
      .spyOn(repo, "save")
      .mockResolvedValue(mockUserEntity as any);

    const newUser = await service.createUser({
      email: "EMAIL",
      firstName: "fName",
      lastName: "lName",
      password: "password",
      roleId: 1,
    });

    expect(newUser).toStrictEqual(mockUserEntity);
    expect(passwordSpy).toHaveBeenCalledWith("password");
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      email: "email",
      firstName: "fName",
      lastName: "lName",
      passwordHash: "password-hash",
      roleId: 1,
    });
  });

  it("should check user password", async () => {
    const compareSpy = jest
      .spyOn(passwordService, "compare")
      .mockResolvedValue(true);

    expect(
      await service.checkUserPassword(mockUserEntity as any, "request-password")
    ).toBe(true);
    expect(compareSpy).toHaveBeenCalledWith(
      "request-password",
      mockUserEntity.passwordHash
    );
  });

  it("should get all users", async () => {
    const repoSpy = jest
      .spyOn(repo, "find")
      .mockResolvedValue([mockUserEntity] as any[]);

    expect(await service.getAll()).toStrictEqual([mockUserEntity]);
    expect(repoSpy).toHaveBeenCalledWith({
      select: ["id", "email", "lastName", "firstName"],
    });
  });

  it("should get user token", () => {
    const jwtSpy = jest.spyOn(jwtService, "sign").mockReturnValue("token");

    expect(service.getUserToken(mockUserEntity as any)).toBe("token");
    expect(jwtSpy).toHaveBeenCalledWith({
      id: mockUserEntity.id,
      email: mockUserEntity.email,
      firstName: mockUserEntity.firstName,
      lastName: mockUserEntity.lastName,
    });
  });
});
