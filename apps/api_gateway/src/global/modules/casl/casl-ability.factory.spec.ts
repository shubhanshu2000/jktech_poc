import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "src/user/entities/user.entity";
import { CaslAbilityFactory } from "./cals-ability.factory";
import { createMock } from "@golevelup/ts-jest";
import { Action } from "src/types/permissions";
import { Repository } from "typeorm";
import { ForbiddenException } from "@nestjs/common";

describe("CaslAbilityFactory", () => {
  let caslAbilityFactory: CaslAbilityFactory;
  let repo: Repository<UserEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMock(),
        },
      ],
    }).compile();

    caslAbilityFactory = module.get(CaslAbilityFactory);
    repo = module.get(getRepositoryToken(UserEntity));
  });

  it("should be defined", () => {
    expect(caslAbilityFactory).toBeDefined();
  });

  it("should create ability for user", async () => {
    const user = new UserEntity();
    user.id = 1;

    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      role: {
        rolePermissions: [
          {
            accessType: "READ",
            permission: {
              name: "User",
            },
          },
        ],
      },
    });

    const ability = await caslAbilityFactory.createForUser(user);

    expect(ability).toBeDefined();
    expect(ability.can(Action.READ, "User")).toBeTruthy();
  });

  it("should not create ability for user", async () => {
    const user = new UserEntity();
    user.id = 1;

    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      role: {
        rolePermissions: [],
      },
    });

    const ability = await caslAbilityFactory.createForUser(user);

    expect(ability).toBeDefined();
    expect(ability.can(Action.READ, "User")).toBeFalsy();
  });

  it("should not create ability for user", async () => {
    const user = new UserEntity();
    user.id = 1;

    (repo.findOne as jest.Mock).mockResolvedValueOnce(null);

    expect(caslAbilityFactory.createForUser(user)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
