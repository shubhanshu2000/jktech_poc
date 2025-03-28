import { MigrationInterface, QueryRunner } from "typeorm";

export class DocumentTable1741863113053 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" SERIAL PRIMARY KEY,
                "original_name" VARCHAR NOT NULL,
                "name" VARCHAR NOT NULL,
                "mimeType" VARCHAR NOT NULL,
                "uploadedAt" TIMESTAMP DEFAULT now()
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "document"`);
  }
}
