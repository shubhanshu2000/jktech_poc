import { IsDefined, IsNumber } from 'class-validator';

export class AddIngestionDTO {
  @IsNumber()
  @IsDefined()
  documentId: number;

  @IsNumber()
  @IsDefined()
  userId: number;
}
