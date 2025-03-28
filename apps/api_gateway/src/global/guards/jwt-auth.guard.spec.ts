import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [JwtAuthGuard, JwtService, Reflector],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });
});
