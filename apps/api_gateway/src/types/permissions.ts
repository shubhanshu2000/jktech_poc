export enum Action {
  READ = "READ",
  WRITE = "WRITE",
  DELETE = "DELETE",
  UPDATE = "UPDATE",
}

export type Permissions = "Document" | "User" | "Ingestion";
