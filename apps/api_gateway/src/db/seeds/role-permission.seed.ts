import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { Action } from "../../types/permissions";
import { RolePermissionEntity } from "../../user/entities/role-permission.entity";

const ROLES_PERMISSIONS: Array<
  Pick<RolePermissionEntity, "accessType" | "roleId" | "permissionId">
> = [
  // Admin has all permissions
  { accessType: Action.READ, roleId: 1, permissionId: 1 },
  { accessType: Action.WRITE, roleId: 1, permissionId: 1 },
  { accessType: Action.UPDATE, roleId: 1, permissionId: 1 },
  { accessType: Action.DELETE, roleId: 1, permissionId: 1 },

  { accessType: Action.READ, roleId: 1, permissionId: 2 },
  { accessType: Action.WRITE, roleId: 1, permissionId: 2 },
  { accessType: Action.UPDATE, roleId: 1, permissionId: 2 },
  { accessType: Action.READ, roleId: 1, permissionId: 2 },

  { accessType: Action.READ, roleId: 1, permissionId: 3 },
  { accessType: Action.WRITE, roleId: 1, permissionId: 3 },
  { accessType: Action.UPDATE, roleId: 1, permissionId: 3 },
  { accessType: Action.DELETE, roleId: 1, permissionId: 3 },

  // Editor has permission to read and write update and delete documents
  { accessType: Action.READ, roleId: 2, permissionId: 1 },
  { accessType: Action.WRITE, roleId: 2, permissionId: 1 },
  { accessType: Action.UPDATE, roleId: 2, permissionId: 1 },
  { accessType: Action.DELETE, roleId: 2, permissionId: 1 },
  { accessType: Action.READ, roleId: 2, permissionId: 2 },
  { accessType: Action.WRITE, roleId: 2, permissionId: 2 },

  // Viewer has permission to read documents
  { accessType: Action.READ, roleId: 3, permissionId: 1 },
  { accessType: Action.READ, roleId: 3, permissionId: 2 },
];

export default class RolePermissionSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(RolePermissionEntity);

    for (const rolePermission of ROLES_PERMISSIONS) {
      const existingRolePermission = await repository.findOne({
        where: {
          accessType: rolePermission.accessType,
          roleId: rolePermission.roleId,
          permissionId: rolePermission.permissionId,
        },
      });

      if (!existingRolePermission) {
        await repository.save(repository.create(rolePermission));
      }
    }
  }
}
