import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddIngestionDTO } from './dto/add-ingestion.dto';
import { IngestionEntity } from './entities/ingestion.entity';
import { IngestionStatusEnum } from './types/StatusEnum';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(IngestionEntity)
    private ingestionRepository: Repository<IngestionEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Add a new ingestion
   * @param data payload to create a new ingestion
   * @returns newly created ingestion
   */
  async addIngestion(data: AddIngestionDTO) {
    const newIngestion = new IngestionEntity();

    newIngestion.documentId = data.documentId;
    newIngestion.userId = data.userId;

    await this.ingestionRepository.save(newIngestion);

    this.eventEmitter.emit('add.ingestion', newIngestion);

    return newIngestion;
  }

  /**
   * Sleep for a given time
   * @param ms number in miliseconds to sleep for
   * @returns void
   */
  async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Change the status of the ingestion to success
   * @param payload of the newly created ingestion
   */
  @OnEvent('add.ingestion', { async: true })
  async addIngestionHandler(payload: IngestionEntity) {
    const random = Math.floor(Math.random() * 11) + 20;

    await this.sleep(random * 1000);

    console.log(`Ingestion ${payload.id} processed after ${random} seconds`);

    payload.status =
      random % 2 === 0
        ? IngestionStatusEnum.SUCCESS
        : IngestionStatusEnum.FAILED;

    this.ingestionRepository.save(payload);
  }

  getIngestion(ingestionId: number) {
    return this.ingestionRepository.findOne({ where: { id: ingestionId } });
  }
}
