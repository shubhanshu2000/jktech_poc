import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { RolePermissionEntity } from "./role-permission.entity";

@Entity({ name: "permissions" })
export class PermissionEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermissionEntity[];
}
