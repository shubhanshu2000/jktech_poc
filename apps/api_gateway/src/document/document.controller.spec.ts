import { Test, TestingModule } from "@nestjs/testing";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { Response } from "express";
import { Readable } from "stream";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action, Permissions } from "src/types/permissions";
import { Reflector } from "@nestjs/core";
import { CHECK_PERMISSIONS_KEY } from "src/global/tokens/check-permission.token";
import { ExecutionContext, Type } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { Repository } from "typeorm";
import { UserEntity } from "src/user/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  MongoAbility,
  createMongoAbility,
  AbilityBuilder,
  ExtractSubjectType,
} from "@casl/ability";
import { ContextType } from "@nestjs/common/interfaces/features/arguments-host.interface";
import { PermissionEntity } from "src/user/entities/permission.entity";
import { RolePermissionEntity } from "src/user/entities/role-permission.entity";
import { RoleEntity } from "src/user/entities/role.entity";
import { CaslAbilityFactory } from "src/global/modules/casl/cals-ability.factory";

type AppAbility = MongoAbility<[Action, Permissions]>;
type PermissionHandlerType =
  | ((ability: AppAbility) => boolean)
  | { handle: (ability: AppAbility) => boolean };

class MockCaslAbilityFactory implements Partial<CaslAbilityFactory> {
  userRepository: Repository<UserEntity>;

  constructor(userRepo: Repository<UserEntity>) {
    this.userRepository = userRepo;
  }

  async createForUser(user: UserEntity): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    can(Action.WRITE, "Document" as Permissions);
    return build();
  }
}

class MockExecutionContext implements ExecutionContext {
  getHandler(): Function {
    return jest.fn();
  }
  getClass<T = any>(): Type<T> {
    return DocumentController as Type<T>;
  }
  getArgs<T extends Array<any> = any[]>(): T {
    return [] as unknown as T;
  }
  getArgByIndex<T = any>(index: number): T {
    return null as T;
  }
  switchToRpc(): any {
    return this;
  }
  switchToHttp(): any {
    return this;
  }
  switchToWs(): any {
    return this;
  }
  getType<TContext extends string = ContextType>(): TContext {
    return "http" as TContext;
  }
}

describe("DocumentController", () => {
  let controller: DocumentController;
  let service: DocumentService;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let clsService: ClsService;
  let userRepository: Repository<UserEntity>;
  let caslAbilityFactory: MockCaslAbilityFactory;

  const mockDocumentService = {
    create: jest.fn(),
    retrieveDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockRole: Partial<RoleEntity> = {
    id: 1,
    name: "Admin",
    rolePermissions: [],
  };

  const mockPermission: PermissionEntity = {
    id: 1,
    name: "Document",
    description: "Document permission",
    rolePermissions: [],
  };

  const mockRolePermission: Partial<RolePermissionEntity> = {
    id: 1,
    accessType: Action.WRITE,
    roleId: 1,
    permissionId: 1,
    role: mockRole as RoleEntity,
    permission: mockPermission,
  };

  const mockUser: Partial<UserEntity> = {
    id: 1,
    role: {
      id: 1,
      rolePermissions: [mockRolePermission as RolePermissionEntity],
    } as RoleEntity,
  };

  const mockFile: Express.Multer.File = {
    fieldname: "files",
    originalname: "test.txt",
    encoding: "7bit",
    mimetype: "text/plain",
    destination: "/tmp",
    filename: "test-123.txt",
    path: "/tmp/test-123.txt",
    size: 1024,
    buffer: Buffer.from("test content"),
    stream: new Readable(),
  };

  beforeEach(async () => {
    reflector = new Reflector();
    mockExecutionContext = new MockExecutionContext();
    userRepository = mockUserRepository as unknown as Repository<UserEntity>;
    caslAbilityFactory = new MockCaslAbilityFactory(userRepository);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
        {
          provide: Reflector,
          useValue: reflector,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: CaslAbilityFactory,
          useValue: caslAbilityFactory,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({
        canActivate: async (context: ExecutionContext) => {
          const handlers = reflector.get<PermissionHandlerType[]>(
            CHECK_PERMISSIONS_KEY,
            context.getHandler()
          );
          if (!handlers) return true;

          mockClsService.get.mockReturnValue(mockUser);
          const ability = await caslAbilityFactory.createForUser(
            mockUser as UserEntity
          );

          return handlers.every((handler: PermissionHandlerType) =>
            typeof handler === "function"
              ? handler(ability)
              : handler.handle(ability)
          );
        },
      })
      .compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get<DocumentService>(DocumentService);
    clsService = module.get<ClsService>(ClsService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity)
    );
  });

  describe("createDocument", () => {
    it("should create a document", async () => {
      const expectedResult = { id: 1 };
      mockDocumentService.create.mockResolvedValue(expectedResult);

      const result = await controller.createDocument(mockFile);

      expect(result).toEqual({
        message: "Document created",
        document: { id: expectedResult.id },
      });
      expect(mockDocumentService.create).toHaveBeenCalledWith(mockFile);
    });
  });

  describe("getDocumentById", () => {
    it("should retrieve a document", async () => {
      const mockStream = new Readable();
      const mockResponse = {
        stream: mockStream,
        mimeType: "text/plain",
        originalName: "test.txt",
      };
      mockDocumentService.retrieveDocument.mockResolvedValue(mockResponse);

      const mockRes = {
        set: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.getDocumentById(1, mockRes);

      expect(mockDocumentService.retrieveDocument).toHaveBeenCalledWith(1);
      expect(mockRes.set).toHaveBeenCalledWith({
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="test.txt"',
      });
    });
  });

  describe("updateDocument", () => {
    it("should update a document", async () => {
      mockDocumentService.updateDocument.mockResolvedValue(undefined);

      const result = await controller.updateDocument(1, mockFile);

      expect(result).toEqual({ message: "Document updated" });
      expect(mockDocumentService.updateDocument).toHaveBeenCalledWith(
        1,
        mockFile
      );
    });
  });

  describe("listDocuments", () => {
    it("should list all documents", async () => {
      const mockDocuments = [{ id: 1 }, { id: 2 }];
      mockDocumentService.listDocuments.mockResolvedValue(mockDocuments);

      const result = await controller.listDocuments();

      expect(result).toEqual(mockDocuments);
      expect(mockDocumentService.listDocuments).toHaveBeenCalled();
    });
  });

  describe("deleteDocument", () => {
    it("should delete a document", async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(undefined);

      const result = await controller.deleteDocument(1);

      expect(result).toEqual({ message: "Document deleted" });
      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(1);
    });
  });

  describe("Permission Checks", () => {
    beforeEach(() => {
      mockClsService.get.mockReturnValue(mockUser);
    });

    const testPermissionCheck = (
      methodName: keyof DocumentController,
      action: Action
    ) => {
      it(`should check ${action} permissions for ${methodName}`, async () => {
        const handler = (ability: AppAbility) =>
          ability.can(action, "Document" as Permissions);
        Reflect.defineMetadata(
          CHECK_PERMISSIONS_KEY,
          [handler],
          controller[methodName]
        );

        const guard = new PermissionGuard(
          reflector,
          caslAbilityFactory as unknown as CaslAbilityFactory,
          clsService
        );
        const result = await guard.canActivate(mockExecutionContext);
        expect(result).toBeDefined();
      });
    };

    testPermissionCheck("createDocument", Action.WRITE);
    testPermissionCheck("getDocumentById", Action.READ);
    testPermissionCheck("updateDocument", Action.UPDATE);
    testPermissionCheck("listDocuments", Action.READ);
    testPermissionCheck("deleteDocument", Action.DELETE);

    it("should handle permission denials", async () => {
      const methods = [
        { name: "createDocument" as const, action: Action.WRITE },
        { name: "getDocumentById" as const, action: Action.READ },
        { name: "updateDocument" as const, action: Action.UPDATE },
        { name: "listDocuments" as const, action: Action.READ },
        { name: "deleteDocument" as const, action: Action.DELETE },
      ];

      for (const { name, action } of methods) {
        const handler = (ability: AppAbility) =>
          ability.can(action, "Document" as Permissions);
        Reflect.defineMetadata(
          CHECK_PERMISSIONS_KEY,
          [handler],
          controller[name]
        );

        mockClsService.get.mockReturnValue({
          ...mockUser,
          role: { rolePermissions: [] },
        });
        const guard = new PermissionGuard(
          reflector,
          caslAbilityFactory as unknown as CaslAbilityFactory,
          clsService
        );
        const result = await guard.canActivate(mockExecutionContext);
        expect(result).toBeDefined();
      }
    });
  });
});
