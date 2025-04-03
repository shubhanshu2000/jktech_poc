import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "./jwt.service";
import * as jsonwebtoken from "jsonwebtoken";
import { UnauthorizedException } from "@nestjs/common";

jest.mock("jsonwebtoken");

describe("JwtService", () => {
  let service: JwtService;
  let configService: ConfigService;

  const mockSecret = "test-secret";
  const mockExpiry = "1h";
  const mockPayload = { userId: 1, email: "test@example.com" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "jwt.secret":
                  return mockSecret;
                case "jwt.expiry":
                  return mockExpiry;
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sign", () => {
    it("should sign payload with correct secret and expiry", () => {
      const mockToken = "mock-jwt-token";
      (jsonwebtoken.sign as jest.Mock).mockReturnValue(mockToken);

      const result = service.sign(mockPayload);

      expect(result).toBe(mockToken);
      expect(jsonwebtoken.sign).toHaveBeenCalledWith(mockPayload, mockSecret, {
        expiresIn: mockExpiry,
      });
      expect(configService.get).toHaveBeenCalledWith("jwt.secret");
      expect(configService.get).toHaveBeenCalledWith("jwt.expiry");
    });

    it("should handle string payload", () => {
      const stringPayload = "test-payload";
      const mockToken = "mock-jwt-token";
      (jsonwebtoken.sign as jest.Mock).mockReturnValue(mockToken);

      const result = service.sign(stringPayload);

      expect(result).toBe(mockToken);
      expect(jsonwebtoken.sign).toHaveBeenCalledWith(
        stringPayload,
        mockSecret,
        { expiresIn: mockExpiry }
      );
    });

    it("should handle Buffer payload", () => {
      const bufferPayload = Buffer.from("test-payload");
      const mockToken = "mock-jwt-token";
      (jsonwebtoken.sign as jest.Mock).mockReturnValue(mockToken);

      const result = service.sign(bufferPayload);

      expect(result).toBe(mockToken);
      expect(jsonwebtoken.sign).toHaveBeenCalledWith(
        bufferPayload,
        mockSecret,
        { expiresIn: mockExpiry }
      );
    });

    it("should throw UnauthorizedException if jwt secret is not configured", () => {
      jest.spyOn(configService, "get").mockImplementation((key: string) => {
        if (key === "jwt.secret") return null;
        return mockExpiry;
      });

      expect(() => service.sign(mockPayload)).toThrow(UnauthorizedException);
      expect(() => service.sign(mockPayload)).toThrow(
        "JWT secret is not configured"
      );
    });
  });
});
