import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sign } from "jsonwebtoken";

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Sign the payload with the JWT secret and expiry
   * @param payload the object payload to be signed
   * @returns the signed JWT token
   * @throws UnauthorizedException if JWT secret is not configured
   */
  sign(payload: string | Buffer | object): string {
    const secret = this.configService.get("jwt.secret");
    const expiry = this.configService.get("jwt.expiry");

    if (!secret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }

    return sign(payload, secret, {
      expiresIn: expiry,
    });
  }
}
