import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ClsService } from "nestjs-cls";
import { CaslAbilityFactory } from "../modules/casl/cals-ability.factory";
import { PermissionGuard } from "./permission.guard";
import { mockUserEntity } from "src/user/entities/__fixtures__/user-entity.fixture";

describe("PermissionGuard", () => {
  let guard: PermissionGuard;
  let cls: DeepMocked<ClsService>;
  let reflector: DeepMocked<Reflector>;
  let abilityFactory: DeepMocked<CaslAbilityFactory>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        { provide: Reflector, useValue: createMock() },
        { provide: CaslAbilityFactory, useValue: createMock() },
        { provide: ClsService, useValue: createMock() },
      ],
    }).compile();

    abilityFactory =
      moduleRef.get<DeepMocked<CaslAbilityFactory>>(CaslAbilityFactory);
    reflector = moduleRef.get<DeepMocked<Reflector>>(Reflector);
    cls = moduleRef.get<DeepMocked<ClsService>>(ClsService);
    guard = moduleRef.get(PermissionGuard);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should throw unauthorized error when user does not exist", () => {
    const context = createMock<ExecutionContext>();
    cls.get.mockReturnValue(null);

    expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should return true when permissions evaluates to success", async () => {
    const context = createMock<ExecutionContext>();
    const handler = (ability: { can: () => boolean }) => ability.can();

    cls.get.mockReturnValue(mockUserEntity);
    reflector.get.mockReturnValue([handler]);

    abilityFactory.createForUser.mockResolvedValue({ can: () => true } as any);

    expect(await guard.canActivate(context)).toBe(true);
  });

  it("should return false when permissions evaluates to failure", async () => {
    const context = createMock<ExecutionContext>();
    const handler = { handle: (ability: any) => ability.can() };

    cls.get.mockReturnValue(mockUserEntity);
    reflector.get.mockReturnValue([handler]);

    abilityFactory.createForUser.mockResolvedValue({ can: () => false } as any);

    expect(await guard.canActivate(context)).toBe(false);
  });

  it("should return true without any permission handlers", async () => {
    const context = createMock<ExecutionContext>();

    cls.get.mockReturnValue(mockUserEntity);
    reflector.get.mockReturnValue(undefined);

    expect(await guard.canActivate(context)).toBe(true);
  });
});
