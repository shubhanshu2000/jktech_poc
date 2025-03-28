import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { Reflector } from "@nestjs/core";
import { Test, TestingModule } from "@nestjs/testing";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { CHECK_PERMISSIONS_KEY } from "src/global/tokens/check-permission.token";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";

describe("IngestionController", () => {
  let controller: IngestionController;
  let service: DeepMocked<IngestionService>;
  let reflect: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        Reflector,
        {
          provide: IngestionService,
          useValue: createMock<IngestionService>(),
        },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue(createMock<PermissionGuard>())
      .compile();

    reflect = module.get(Reflector);
    controller = module.get<IngestionController>(IngestionController);
    service = module.get(IngestionService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have auth for create ingestion", () => {
    const handlers = reflect.get(CHECK_PERMISSIONS_KEY, controller.create);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call addIngestion", async () => {
    jest.spyOn(service, "addIngestion").mockResolvedValue({
      message: "success",
      ingestion: {
        documentId: 1,
        id: 1,
        ingestedAt: "2025-04-14T00:00:00.000Z",
        status: "success",
        userId: 1,
      },
    });

    const createIngestionDto = { documentId: 1 };

    const result = await controller.create(createIngestionDto);

    expect(service.addIngestion).toHaveBeenCalledWith(createIngestionDto);
    expect(result).toEqual({
      message: "success",
      ingestion: {
        documentId: 1,
        id: 1,
        ingestedAt: "2025-04-14T00:00:00.000Z",
        status: "success",
        userId: 1,
      },
    });
  });

  it("should have auth for find ingestion", () => {
    const handlers = reflect.get(CHECK_PERMISSIONS_KEY, controller.findOne);
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call findIngestionById", async () => {
    jest.spyOn(service, "findIngestionById").mockResolvedValue({
      document: {
        id: 1,
        name: "document",
      },
      id: 1,
      user: {
        id: 1,
        email: "email",
        name: "name",
      },
      status: "success",
    });

    const result = await controller.findOne(1);

    expect(service.findIngestionById).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      document: {
        id: 1,
        name: "document",
      },
      id: 1,
      user: {
        id: 1,
        email: "email",
        name: "name",
      },
      status: "success",
    });
  });
});
