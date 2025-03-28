import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { CheckPermissions } from "src/global/decorators/check-permission.decorator";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action } from "src/types/permissions";
import { CreateIngestionDto } from "./dto/create-ingestion.dto";
import { IngestionService } from "./ingestion.service";

@Controller("ingestion")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.WRITE, "Ingestion"))
  create(@Body() createIngestionDto: CreateIngestionDto) {
    return this.ingestionService.addIngestion(createIngestionDto);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "Ingestion"))
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.ingestionService.findIngestionById(id);
  }
}
