export interface IngestionResponse {
  message: string;
  ingestion: {
    id: number;
    userId: number;
    documentId: number;
    status: string;
    ingestedAt: string;
  };
}
