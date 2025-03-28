import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/user/entities/user.entity";
import { CaslAbilityFactory } from "./cals-ability.factory";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
