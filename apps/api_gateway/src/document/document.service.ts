/* eslint-disable no-undef */
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createReadStream, existsSync } from "fs";
import { rm, stat } from "fs/promises";
import { join } from "path";
import { Repository } from "typeorm";
import { convertBytes } from "./utils/convertByte";
import { DocumentEntity } from "./entities/document.entity";
import { Response } from "express";
import { Readable } from "stream";

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>,
    private readonly configService: ConfigService
  ) {}

  /**
   * saves the document entry and uploaded file
   * @param document the newly uploaded document
   * @returns void
   */
  async create(document: Express.Multer.File) {
    const newDocument = new DocumentEntity();

    newDocument.originalName = document.originalname;
    newDocument.name = document.filename;
    newDocument.mimeType = document.mimetype;

    try {
      return await this.documentRepository.save(newDocument);
    } catch (error) {
      await rm(document.path);
      throw error;
    }
  }

  /**
   * Find the document by id
   * @param id existing document's id
   * @returns the document if found else nul
   */
  async getDocumentById(id: number) {
    const document = await this.documentRepository.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  /**
   * prepare a read stream for the document
   * @param id the existing document's id
   * @returns stream of the document
   */
  async retrieveDocument(
    id: number
  ): Promise<{ stream: Readable; mimeType: string; originalName: string }> {
    const document = await this.documentRepository.findOne({ where: { id } });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    const filePath = join(
      this.configService.get("upload.path") as string,
      document.name
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException("File not found on server");
    }

    return {
      stream: createReadStream(filePath),
      mimeType: document.mimeType,
      originalName: document.originalName,
    };
  }

  /**
   * update the document with the new one
   * @param id existing document's id
   * @param document new document to replace the old one
   * @returns void
   */
  async updateDocument(id: number, document: Express.Multer.File) {
    const oldDocument = await this.getDocumentById(id);
    const documentToDelete = oldDocument.name;

    oldDocument.originalName = document.originalname;
    oldDocument.name = document.filename;
    oldDocument.mimeType = document.mimetype;

    try {
      await this.documentRepository.save(oldDocument);
      await rm(
        join(this.configService.get("upload.path") as string, documentToDelete)
      );
    } catch (error) {
      await rm(document.path);
      throw error;
    }
  }

  /**
   * delete the document
   * @param id existing document's id
   */
  async deleteDocument(id: number) {
    const document = await this.getDocumentById(id);

    await rm(
      join(this.configService.get("upload.path") as string, document.name)
    );
    await this.documentRepository.remove(document);
  }

  async getSizeOfDocument(path: string) {
    const stats = await stat(path);
    const size = stats.size;

    // convert it to human readable format
    return convertBytes(size);
  }

  async listDocuments() {
    const documents = await this.documentRepository.find();

    return Promise.all(
      documents.map(async (document) => {
        const humanSize = await this.getSizeOfDocument(
          join(this.configService.get("upload.path") as string, document.name)
        );

        return {
          id: document.id,
          name: document.originalName,
          size: humanSize,
          uploadedAt: document.uploadedAt,
        };
      })
    );
  }
}
