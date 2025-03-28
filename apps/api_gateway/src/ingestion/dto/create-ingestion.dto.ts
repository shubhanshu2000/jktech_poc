import { IsDefined, IsNumber } from "class-validator";

export class CreateIngestionDto {
  @IsNumber()
  @IsDefined()
  documentId: number;
}
