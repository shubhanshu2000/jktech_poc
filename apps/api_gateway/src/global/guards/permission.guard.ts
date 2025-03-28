import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClsService } from "nestjs-cls";
import { UserEntity } from "src/user/entities/user.entity";
import { CaslAbilityFactory } from "../modules/casl/cals-ability.factory";
import { AppAbility, PermissionHandler } from "../modules/casl/types";
import { CHECK_PERMISSIONS_KEY } from "../tokens/check-permission.token";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = this.cls.get<UserEntity>("authUser");

    const permissionHandlers =
      this.reflector.get<PermissionHandler[]>(
        CHECK_PERMISSIONS_KEY,
        context.getHandler(),
      ) || [];

    if (!user) {
      throw new UnauthorizedException();
    }

    const ability = await this.abilityFactory.createForUser(user);

    for (const permissionHandler of permissionHandlers) {
      const result = this.execPermissionHandler(permissionHandler, ability);

      if (!result) {
        return false;
      }
    }

    return true;
  }

  private execPermissionHandler(
    handler: PermissionHandler,
    ability: AppAbility,
  ) {
    if (typeof handler === "function") {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
