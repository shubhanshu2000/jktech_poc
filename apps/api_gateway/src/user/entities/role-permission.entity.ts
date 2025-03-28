import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Action } from "../../types/permissions";
import { PermissionEntity } from "./permission.entity";
import { RoleEntity } from "./role.entity";

@Entity({ name: "roles_permissions" })
export class RolePermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "access_type", enum: Action, enumName: "Action" })
  accessType: string;

  @PrimaryColumn({ name: "role_id" })
  roleId: number;

  @PrimaryColumn({ name: "permission_id" })
  permissionId: number;

  @ManyToOne(() => RoleEntity, (role) => role.rolePermissions)
  @JoinColumn({ name: "role_id" })
  role: RoleEntity;

  @ManyToOne(() => PermissionEntity, (permission) => permission.rolePermissions)
  @JoinColumn({ name: "permission_id" })
  permission: PermissionEntity;
}
