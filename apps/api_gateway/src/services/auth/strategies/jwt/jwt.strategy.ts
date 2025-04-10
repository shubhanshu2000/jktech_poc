import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWTVerifiedPayload } from "../../interfaces/payload.interface";
import { ClsService } from "nestjs-cls";
import { UserService } from "src/services/user/user.service";
import { RedisService } from "src/services/redis/redis.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    readonly config: ConfigService,
    private readonly user: UserService,
    private readonly cls: ClsService,
    private readonly redisService: RedisService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get("jwt.secret") as string,
    });
  }

  /**
   * Validate the JWT payload and also store it in the cls context
   * @param payload the verified JWT payload
   * @returns the payload if the user is valid to be stored in the request.user
   */
  async validate(payload: JWTVerifiedPayload) {
    const token = this.cls.get("token");

    if (await this.redisService.isBlacklisted(token)) {
      throw new ForbiddenException("Token has been revoked");
    }

    const userDetails = await this.user.isUserExists(payload.email);

    if (!userDetails) {
      throw new ForbiddenException("Invalid user provided.");
    }

    this.cls.set("authUser", userDetails);

    return payload;
  }
}
