import { DataSource } from "typeorm";
import { Seeder } from "typeorm-extension";
import { PermissionEntity } from "../../user/entities/permission.entity";

const PERMISSIONS: Array<
  Pick<PermissionEntity, "id" | "name" | "description">
> = [
  {
    id: 1,
    name: "Document",
    description: "Resource to manage Documents",
  },
  {
    id: 2,
    name: "Ingestion",
    description: "Able to Download a document",
  },
  {
    id: 3,
    name: "User",
    description: "Ablee to create a user",
  },
];

export default class PermissionSeeder implements Seeder {
  public track = true;

  public async run(dataSource: DataSource): Promise<any> {
    const repository = dataSource.getRepository(PermissionEntity);

    for (const permission of PERMISSIONS) {
      const existingPermission = await repository.findOne({
        where: { id: permission.id },
      });

      console.log({ existingPermission, permission });

      if (!existingPermission) {
        await repository.save(permission);
      }
    }
  }
}
