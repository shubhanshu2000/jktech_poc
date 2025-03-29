import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./entities/user.entity";
import { UserController } from "./user.controller";
import { AuthService } from "src/services/auth/auth.service";
import { UserService } from "src/services/user/user.service";
import { PasswordService } from "src/services/password/password.service";
import { JwtService } from "src/services/jwt/jwt.service";
import { JwtStrategy } from "src/services/auth/strategies/jwt/jwt.strategy";
import { RedisService } from "src/services/redis/redis.service";
import { TokenBlacklistGuard } from "src/global/guards/token-blacklist.guard";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [
    AuthService,
    UserService,
    PasswordService,
    JwtService,
    JwtStrategy,
    RedisService,
    TokenBlacklistGuard,
  ],
})
export class UserModule {}
