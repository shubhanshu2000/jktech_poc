import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IngestionStatusEnum } from '../types/StatusEnum';

@Entity({ name: 'ingestions' })
export class IngestionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id', unique: true })
  documentId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ enum: IngestionStatusEnum, enumName: 'Status' })
  status: IngestionStatusEnum;

  @CreateDateColumn({ name: 'ingested_at' })
  ingestedAt: Date;
}
