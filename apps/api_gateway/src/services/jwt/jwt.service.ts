import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { sign } from "jsonwebtoken";

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Sign the payload with the JWT secret and expiry
   * @param payload the object payload to be signed
   * @returns the signed JWT token
   */
  sign(payload: string | Buffer | object): string {
    return sign(payload, this.configService.get("jwt.secret") as string, {
      expiresIn: this.configService.get("jwt.expiry") as string,
    });
  }
}
