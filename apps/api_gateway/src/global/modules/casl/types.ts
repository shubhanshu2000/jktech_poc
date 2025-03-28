import { InferSubjects, MongoAbility } from "@casl/ability";
import { Action, Permissions } from "src/types/permissions";

export type Subjects = InferSubjects<Permissions> | "all";

export type AppAbility = MongoAbility<[Action, Subjects]>;

interface IPermissionHandler {
  handle(ability: AppAbility): boolean;
}

type PermissionHandlerCallback = (ability: AppAbility) => boolean;

export type PermissionHandler = IPermissionHandler | PermissionHandlerCallback;
