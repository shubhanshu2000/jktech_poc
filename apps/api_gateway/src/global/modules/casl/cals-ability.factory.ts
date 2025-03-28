import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Action, Permissions } from "src/types/permissions";
import { UserEntity } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { AppAbility } from "./types";

@Injectable()
export class CaslAbilityFactory {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createForUser(user: UserEntity) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const userPopulated = await this.userRepository.findOne({
      where: { id: user.id },
      relations: [
        "role",
        "role.rolePermissions",
        "role.rolePermissions.permission",
      ],
    });

    if (!userPopulated) {
      throw new ForbiddenException("User not found");
    }

    userPopulated.role.rolePermissions.forEach((rolePermission) => {
      can(
        rolePermission.accessType as Action,
        rolePermission.permission.name as Permissions,
      );
    });

    return build();
  }
}
