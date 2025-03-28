import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { RoleEntity } from "../../user/entities/role.entity";

const ROLES: Array<Pick<RoleEntity, "id" | "name">> = [
  {
    id: 1,
    name: "Admin",
  },
  {
    id: 2,
    name: "Editor",
  },
  {
    id: 3,
    name: "Viewer",
  },
];

export default class RoleSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(RoleEntity);

    for (const role of ROLES) {
      const existingRole = await repository.findOne({
        where: { id: role.id },
      });

      if (!existingRole) {
        await repository.save(role);
      }
    }
  }
}
