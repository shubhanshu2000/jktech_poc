import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { RolePermissionEntity } from "./role-permission.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "roles" })
export class RoleEntity {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => UserEntity, (user) => user.roleId)
  users: UserEntity[];

  @OneToMany(
    () => RolePermissionEntity,
    (rolePermission) => rolePermission.role,
  )
  rolePermissions: RolePermissionEntity[];
}
