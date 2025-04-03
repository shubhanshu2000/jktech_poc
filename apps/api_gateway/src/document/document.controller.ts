/* eslint-disable no-undef */
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { CheckPermissions } from "src/global/decorators/check-permission.decorator";
import { JwtAuthGuard } from "src/global/guards/jwt-auth.guard";
import { PermissionGuard } from "src/global/guards/permission.guard";
import { Action } from "src/types/permissions";
import { DocumentService } from "./document.service";
import { Response } from "express";

@ApiTags("document")
@Controller("document")
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiBody({
    description: "Upload new document",
    schema: {
      type: "object",
      properties: {
        files: {
          type: "file",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor("files"))
  @CheckPermissions((ability) => ability.can(Action.WRITE, "Document"))
  async createDocument(@UploadedFile() document: Express.Multer.File) {
    const newDocument = await this.documentService.create(document);

    return {
      message: "Document created",
      document: {
        id: newDocument.id,
      },
    };
  }

  @Get(":id")
  @ApiBearerAuth()
  @CheckPermissions((ability) => ability.can(Action.READ, "Document"))
  async getDocumentById(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    try {
      const { stream, mimeType, originalName } =
        await this.documentService.retrieveDocument(id);

      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${originalName}"`,
      });

      stream.pipe(res);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  @Put(":id")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Upload new document to update",
    schema: {
      type: "object",
      properties: {
        files: {
          type: "file",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @UseInterceptors(FileInterceptor("files"))
  @CheckPermissions((ability) => ability.can(Action.UPDATE, "Document"))
  async updateDocument(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() document: Express.Multer.File
  ) {
    await this.documentService.updateDocument(id, document);

    return {
      message: "Document updated",
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.READ, "Document"))
  async listDocuments() {
    return this.documentService.listDocuments();
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @CheckPermissions((ability) => ability.can(Action.DELETE, "Document"))
  async deleteDocument(@Param("id", ParseIntPipe) id: number) {
    await this.documentService.deleteDocument(id);

    return {
      message: "Document deleted",
    };
  }
}
