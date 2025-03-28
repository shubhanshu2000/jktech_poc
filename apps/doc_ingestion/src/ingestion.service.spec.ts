import { Test } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AppService } from './ingestion.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngestionEntity } from './entities/ingestion.entity';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AppService', () => {
  let service: AppService;
  let repo: DeepMocked<Repository<IngestionEntity>>;
  let eventEmitter: DeepMocked<EventEmitter2>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: EventEmitter2, useValue: createMock() },
        {
          provide: getRepositoryToken(IngestionEntity),
          useValue: createMock(),
        },
      ],
    }).compile();

    eventEmitter = module.get(EventEmitter2);
    repo = module.get(getRepositoryToken(IngestionEntity));
    service = module.get(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add a new ingestion', async () => {
    const data = {
      documentId: 1,
      userId: 1,
    };

    const result = await service.addIngestion(data);

    expect(result).toBeDefined();
    expect(result.documentId).toEqual(data.documentId);
    expect(result.userId).toEqual(data.userId);
    expect(eventEmitter.emit).toHaveBeenCalledWith('add.ingestion', result);
  });

  it('should sleep for a given time', async () => {
    const ms = 1000;

    const result = await service.sleep(ms);

    expect(result).toBeUndefined();
  });

  it('should change the status of the ingestion to success', async () => {
    const payload = new IngestionEntity();
    payload.id = 1;

    const random = 25;

    jest.spyOn(service, 'sleep').mockResolvedValue(undefined);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    await service.addIngestionHandler(payload);

    expect(service.sleep).toHaveBeenCalledWith(random * 1000);
    expect(repo.save).toHaveBeenCalledWith(payload);
  });

  it('should change the status of the ingestion to failed', async () => {
    const payload = new IngestionEntity();
    payload.id = 1;

    const random = 24;

    jest.spyOn(service, 'sleep').mockResolvedValue(undefined);
    jest.spyOn(Math, 'random').mockReturnValue(0.4);

    await service.addIngestionHandler(payload);

    expect(service.sleep).toHaveBeenCalledWith(random * 1000);
    expect(repo.save).toHaveBeenCalledWith(payload);
  });

  it('should get an ingestion', async () => {
    const ingestionId = 1;

    repo.findOne.mockResolvedValue({ id: ingestionId } as any);

    await service.getIngestion(ingestionId);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: ingestionId } });
  });
});
