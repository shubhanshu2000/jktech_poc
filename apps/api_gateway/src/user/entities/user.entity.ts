import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoleEntity } from "./role.entity";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column()
  email: string;

  @Column({ name: "role_id" })
  roleId: number;

  @ManyToOne(() => RoleEntity, (role) => role.id)
  @JoinColumn({ name: "role_id" })
  role: RoleEntity;

  @Column({ name: "password" })
  passwordHash: string;
}
