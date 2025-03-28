import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { StreamableFile } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { DocumentController } from "./document.controller";
import { DocumentService } from "./document.service";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { Reflector } from "@nestjs/core";
import { CHECK_PERMISSIONS_KEY } from "src/global/tokens/check-permission.token";

describe("DocumentController", () => {
  let controller: DocumentController;
  let service: DeepMocked<DocumentService>;
  let reflect: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        Reflector,
        {
          provide: DocumentService,
          useValue: createMock<DocumentService>(),
        },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue(createMock<PermissionGuard>())
      .overrideGuard(JwtAuthGuard)
      .useValue(createMock<JwtAuthGuard>())
      .compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get(DocumentService);
    reflect = module.get(Reflector);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should have auth for createDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.createDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call createDocument", async () => {
    jest.spyOn(service, "create").mockResolvedValue({
      id: 1,
    } as any);

    const document = {
      fieldname: "document",
      originalname: "test.txt",
      encoding: "7bit",
      mimetype: "text/plain",
      buffer: Buffer.from("test"),
      size: 4,
    };

    const result = await controller.createDocument(document as any);

    expect(service.create).toHaveBeenCalledWith(document);
    expect(result).toEqual({
      message: "Document created",
      document: {
        id: 1,
      },
    });
  });

  it("should have auth for getDocumentById", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.getDocumentById,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call getDocumentById", async () => {
    const stream = {
      pipe: jest.fn(),
    };

    jest.spyOn(service, "retrieveDocument").mockResolvedValue(stream as any);

    const result = await controller.getDocumentById(1);

    expect(service.retrieveDocument).toHaveBeenCalledWith(1);
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it("should have auth for updateDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.updateDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call updateDocument", async () => {
    jest.spyOn(service, "updateDocument").mockResolvedValue({
      id: 1,
    } as any);

    const document = {
      fieldname: "document",
      originalname: "test.txt",
      encoding: "7bit",
      mimetype: "text/plain",
      buffer: Buffer.from("test"),
      size: 4,
    };

    const result = await controller.updateDocument(1, document as any);

    expect(service.updateDocument).toHaveBeenCalledWith(1, document);
    expect(result).toEqual({
      message: "Document updated",
    });
  });

  it("should have auth for deleteDocument", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.deleteDocument,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call deleteDocument", async () => {
    jest.spyOn(service, "deleteDocument").mockResolvedValue({
      id: 1,
    } as any);

    const result = await controller.deleteDocument(1);

    expect(service.deleteDocument).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: "Document deleted",
    });
  });

  it("should have auth for listDocuments", () => {
    const handlers = reflect.get(
      CHECK_PERMISSIONS_KEY,
      controller.listDocuments,
    );
    expect(handlers).toHaveLength(1);
    expect(handlers[0]).toBeInstanceOf(Function);

    expect(handlers[0]({ can: () => true })).toBeTruthy();
  });

  it("should call listDocuments", async () => {
    const documents = [
      {
        id: 1,
      },
    ];

    jest.spyOn(service, "listDocuments").mockResolvedValue(documents as any);

    const result = await controller.listDocuments();

    expect(service.listDocuments).toHaveBeenCalled();
    expect(result).toEqual(documents);
  });
});
