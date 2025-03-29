import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { TokenBlacklistGuard } from "./token-blacklist.guard";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly tokenBlacklistGuard: TokenBlacklistGuard) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check if token is blacklisted
    await this.tokenBlacklistGuard.canActivate(context);
    // Then proceed with JWT validation
    return super.canActivate(context) as Promise<boolean>;
  }
}
