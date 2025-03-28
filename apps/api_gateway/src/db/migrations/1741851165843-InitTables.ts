import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1741851165843 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // create role table
    await queryRunner.query(`
      CREATE TYPE Action AS ENUM ('READ', 'WRITE', 'DELETE', 'UPDATE')
    `);

    await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS roles (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
          )
        `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        password VARCHAR(255) NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS permissions (
            id INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL
          )
        `);

    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS roles_permissions (
              id SERIAL NOT NULL,
              role_id INT NOT NULL,
              access_type Action NOT NULL,
              permission_id INT NOT NULL,
              PRIMARY KEY (id, role_id, permission_id),
              FOREIGN KEY (role_id) REFERENCES roles(id),
              FOREIGN KEY (permission_id) REFERENCES permissions(id)
            )
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop role table
    await queryRunner.query(`DROP TABLE users`);
    await queryRunner.query(`DROP TABLE roles_permissions`);
    await queryRunner.query(`DROP TABLE roles`);
    await queryRunner.query(`DROP TABLE permissions`);
    await queryRunner.query(`DROP TYPE Action`);
  }
}
