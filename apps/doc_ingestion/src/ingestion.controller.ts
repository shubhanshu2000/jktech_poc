import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './ingestion.service';
import { AddIngestionDTO } from './dto/add-ingestion.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('add.ingestion')
  async addIngestion(data: AddIngestionDTO) {
    const ingestion = await this.appService.addIngestion(data);

    return {
      message: 'Successfully added',
      ingestion,
    };
  }

  @MessagePattern('get.ingestion')
  async getIngestion(id: number) {
    const ingestion = await this.appService.getIngestion(id);

    return {
      message: 'Successfully fetched',
      ingestion,
    };
  }
}
