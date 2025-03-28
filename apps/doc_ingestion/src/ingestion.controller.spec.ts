import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './ingestion.controller';
import { AppService } from './ingestion.service';

describe('IngestionController', () => {
  let controller: AppController;
  let service: DeepMocked<AppService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: createMock<AppService>(),
        },
      ],
    }).compile();

    controller = module.get(AppController);
    service = module.get(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should add ingestion', async () => {
    const data = { documentId: 1, userId: 1 };
    const ingestion = { id: 1, ...data };

    jest.spyOn(service, 'addIngestion').mockResolvedValue(ingestion as any);

    expect(await controller.addIngestion(data)).toStrictEqual({
      message: 'Successfully added',
      ingestion,
    });
  });

  it('should get ingestion', async () => {
    const id = 1;
    const ingestion = { id };

    jest.spyOn(service, 'getIngestion').mockResolvedValue(ingestion as any);

    expect(await controller.getIngestion(id)).toStrictEqual({
      message: 'Successfully fetched',
      ingestion,
    });
  });
});
