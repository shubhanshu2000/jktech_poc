import { MigrationInterface, QueryRunner } from 'typeorm';

export class IngestionTable1741877098124 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE Status AS ENUM (
        'PENDING',
        'SUCCESS',
        'FAILED'
      )
      `);

    await queryRunner.query(`
      CREATE TABLE ingestions (
        id SERIAL PRIMARY KEY,
        document_id INTEGER UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        status Status NOT NULL DEFAULT 'PENDING',
        ingested_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE ingestions;');
    await queryRunner.query('DROP TYPE Status;');
  }
}
