import { createMock, DeepMocked } from "@golevelup/ts-jest/lib/mocks";
import { ClientProxy } from "@nestjs/microservices";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ClsModule, ClsService } from "nestjs-cls";
import { INGESTION_SERVICE } from "src/global/tokens/ingestion.token";
import { UserEntity } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { IngestionService } from "./ingestion.service";
import { mockUserEntity } from "src/user/entities/__fixtures__/user-entity.fixture";
import { DocumentEntity } from "src/document/entities/document.entity";

// jest mock firstValueFrom function
jest.mock("rxjs", () => ({
  ...jest.requireActual("rxjs"),
  firstValueFrom: jest.fn().mockImplementation((obs) => Promise.resolve(obs)),
}));

describe("IngestionService", () => {
  let service: IngestionService;
  let ingestionClient: DeepMocked<ClientProxy>;
  let userRepo: Repository<UserEntity>;
  let documentRepo: Repository<DocumentEntity>;
  let clsService: ClsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClsModule],
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: createMock(),
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMock(),
        },
        {
          provide: INGESTION_SERVICE,
          useValue: createMock<ClientProxy>(),
        },
      ],
    }).compile();

    clsService = module.get(ClsService);
    ingestionClient = module.get(INGESTION_SERVICE);
    userRepo = module.get(getRepositoryToken(UserEntity));
    documentRepo = module.get(getRepositoryToken(DocumentEntity));
    service = module.get<IngestionService>(IngestionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should add ingestion", async () => {
    jest.spyOn(ingestionClient, "send").mockReturnValue({
      message: "success",
      ingestion: {
        id: 1,
        documentId: 1,
        userId: 1,
        status: "success",
        ingestedAt: "2021-09-01T00:00:00Z",
      },
    } as any);

    let result = null;

    await clsService.runWith({ authUser: { id: 1 } } as any, async () => {
      result = await service.addIngestion({ documentId: 1 });
    });

    expect(ingestionClient.send).toHaveBeenCalledWith("add.ingestion", {
      userId: 1,
      documentId: 1,
    });
    expect(result).toMatchObject({
      message: "success",
      ingestion: {
        id: 1,
        documentId: 1,
        userId: 1,
        status: "success",
        ingestedAt: "2021-09-01T00:00:00Z",
      },
    });
  });

  it("should find ingestion by id", async () => {
    jest.spyOn(ingestionClient, "send").mockReturnValue({
      message: "success",
      ingestion: {
        id: 1,
        documentId: 1,
        userId: 1,
        status: "success",
        ingestedAt: "2021-09-01T00:00:00Z",
      },
    } as any);

    jest.spyOn(userRepo, "findOneByOrFail").mockResolvedValue(mockUserEntity);
    jest.spyOn(documentRepo, "findOneByOrFail").mockResolvedValue({
      id: 1,
      originalName: "test",
      mimeType: "application/pdf",
      name: "test",
      uploadedAt: new Date("2021-09-01T00:00:00Z"),
    });

    const result = await service.findIngestionById(1);

    expect(ingestionClient.send).toHaveBeenCalledWith("get.ingestion", 1);
    expect(userRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
    expect(documentRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
    expect(result).toMatchObject({
      id: 1,
      user: {
        id: 0,
        name: "firstName",
        email: "email",
      },
      document: {
        id: 1,
        name: "test",
      },
      status: "success",
    });
  });
});
