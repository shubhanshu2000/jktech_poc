import { SetMetadata } from "@nestjs/common";
import { PermissionHandler } from "../modules/casl/types";
import { CHECK_PERMISSIONS_KEY } from "../tokens/check-permission.token";

export const CheckPermissions = (...handlers: PermissionHandler[]) =>
  SetMetadata(CHECK_PERMISSIONS_KEY, handlers);
