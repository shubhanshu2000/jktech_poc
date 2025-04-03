import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import { Readable } from "stream";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DocumentService } from "./document.service";
import { DocumentEntity } from "./entities/document.entity";

// Setup all mocks
jest.mock("path-scurry", () => ({
  Scurry: jest.fn(),
  Path: jest.fn(),
  native: {
    sep: "/",
    delimiter: ":",
  },
}));

jest.mock("glob", () => ({
  sync: jest.fn(),
  glob: jest.fn(),
  Glob: jest.fn(),
  hasMagic: jest.fn(),
  escape: jest.fn(),
  unescape: jest.fn(),
}));

jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    getRepository: jest.fn(),
    Repository: jest.fn(),
    DataSource: jest.fn(),
    EntityManager: jest.fn(),
    PlatformTools: {
      load: jest.fn(),
      pathModule: {
        dirname: jest.fn(),
        resolve: jest.fn(),
      },
    },
  };
});

jest.mock("path", () => ({
  join: jest.fn((a, b) => `${a}/${b}`),
  dirname: jest.fn((path) => path),
  resolve: jest.fn((path) => path),
  normalize: jest.fn((path) => path),
  basename: jest.fn((path) => path),
  extname: jest.fn((path) => ".txt"),
  parse: jest.fn(),
  format: jest.fn(),
  sep: "/",
  delimiter: ":",
}));

jest.mock("fs", () => ({
  createReadStream: jest.fn(() => new Readable()),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("fs/promises", () => ({
  rm: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

jest.mock("./utils/convertByte", () => ({
  convertBytes: jest.fn().mockReturnValue("1 KB"),
}));

describe("DocumentService", () => {
  let service: DocumentService;
  let repository: Repository<DocumentEntity>;
  let configService: ConfigService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue("/upload/path"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(DocumentEntity),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    repository = module.get<Repository<DocumentEntity>>(
      getRepositoryToken(DocumentEntity)
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const mockFile = {
      originalname: "test.txt",
      filename: "test-123.txt",
      mimetype: "text/plain",
      path: "/tmp/test-123.txt",
    } as Express.Multer.File;

    it("should create a document", async () => {
      const mockDocument = {
        id: 1,
        originalName: mockFile.originalname,
        name: mockFile.filename,
        mimeType: mockFile.mimetype,
      };

      mockRepository.save.mockResolvedValue(mockDocument);

      const result = await service.create(mockFile);
      expect(result).toEqual(mockDocument);
    });

    it("should handle create error and cleanup file", async () => {
      mockRepository.save.mockRejectedValue(new Error("Save failed"));
      const fsPromises = require("fs/promises");

      await expect(service.create(mockFile)).rejects.toThrow("Save failed");
      expect(fsPromises.rm).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe("getDocumentById", () => {
    it("should return a document if found", async () => {
      const mockDocument = { id: 1, name: "test.txt" };
      mockRepository.findOne.mockResolvedValue(mockDocument);

      const result = await service.getDocumentById(1);
      expect(result).toEqual(mockDocument);
    });

    it("should throw NotFoundException if document not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getDocumentById(1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("retrieveDocument", () => {
    const mockDocument = {
      id: 1,
      name: "test.txt",
      mimeType: "text/plain",
      originalName: "original.txt",
    };

    it("should retrieve a document", async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      require("fs").existsSync.mockReturnValue(true);

      const result = await service.retrieveDocument(1);

      expect(result).toEqual({
        stream: expect.any(Readable),
        mimeType: mockDocument.mimeType,
        originalName: mockDocument.originalName,
      });
    });

    it("should throw NotFoundException when document not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.retrieveDocument(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException when file not found on server", async () => {
      mockRepository.findOne.mockResolvedValue(mockDocument);
      require("fs").existsSync.mockReturnValue(false);

      await expect(service.retrieveDocument(1)).rejects.toThrow(
        "File not found on server"
      );
    });
  });

  describe("updateDocument", () => {
    const mockFile = {
      originalname: "updated.txt",
      filename: "updated-123.txt",
      mimetype: "text/plain",
      path: "/tmp/updated-123.txt",
    } as Express.Multer.File;

    it("should update a document", async () => {
      const oldDocument = {
        id: 1,
        name: "old.txt",
      };

      mockRepository.findOne.mockResolvedValue(oldDocument);
      mockRepository.save.mockResolvedValue({
        ...oldDocument,
        originalName: mockFile.originalname,
        name: mockFile.filename,
        mimeType: mockFile.mimetype,
      });

      await service.updateDocument(1, mockFile);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(require("fs/promises").rm).toHaveBeenCalled();
    });

    it("should throw NotFoundException when document not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.updateDocument(1, mockFile)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle update error and cleanup new file", async () => {
      const oldDocument = {
        id: 1,
        name: "old.txt",
      };

      mockRepository.findOne.mockResolvedValue(oldDocument);
      mockRepository.save.mockRejectedValue(new Error("Update failed"));

      await expect(service.updateDocument(1, mockFile)).rejects.toThrow(
        "Update failed"
      );
      expect(require("fs/promises").rm).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe("deleteDocument", () => {
    it("should delete a document", async () => {
      const mockDocument = {
        id: 1,
        name: "test.txt",
      };

      mockRepository.findOne.mockResolvedValue(mockDocument);

      await service.deleteDocument(1);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockDocument);
      expect(require("fs/promises").rm).toHaveBeenCalled();
    });

    it("should throw NotFoundException when document not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDocument(1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("listDocuments", () => {
    it("should list all documents with sizes", async () => {
      const mockDocuments = [
        {
          id: 1,
          name: "doc1.txt",
          originalName: "original1.txt",
          uploadedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockDocuments);
      require("fs/promises").stat.mockResolvedValue({ size: 1024 });

      const result = await service.listDocuments();

      expect(result).toEqual([
        {
          id: 1,
          name: "original1.txt",
          size: "1 KB",
          uploadedAt: expect.any(Date),
        },
      ]);
    });

    it("should handle empty document list", async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.listDocuments();

      expect(result).toEqual([]);
    });
  });

  describe("getSizeOfDocument", () => {
    it("should return human readable size", async () => {
      require("fs/promises").stat.mockResolvedValue({ size: 1024 });

      const result = await service.getSizeOfDocument("test.txt");

      expect(result).toBe("1 KB");
      expect(require("fs/promises").stat).toHaveBeenCalledWith("test.txt");
    });

    it("should handle file stat error", async () => {
      require("fs/promises").stat.mockRejectedValue(
        new Error("File not found")
      );

      await expect(service.getSizeOfDocument("test.txt")).rejects.toThrow(
        "File not found"
      );
    });
  });
});
