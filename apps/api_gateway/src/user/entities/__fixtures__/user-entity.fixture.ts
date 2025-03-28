import { UserEntity } from "../user.entity";

export const mockUserEntity: UserEntity = {
  id: 0,
  roleId: 1,
  firstName: "firstName",
  lastName: "lastName",
  role: { id: 1, name: "user", rolePermissions: [], users: [] },
  email: "email",
  passwordHash: "p",
};
