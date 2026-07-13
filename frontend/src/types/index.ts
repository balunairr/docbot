export type DocumentFileType = "pdf" | "docx";

export interface HealthResponse {
  status: string;
}

export interface DocumentSummary {
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  chunkCount: number;
  createdAt: string;
}

export interface DocumentListResponse {
  documents: DocumentSummary[];
}

export interface IngestDocumentResult {
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  chunkCount: number;
}

export interface SourceReference {
  documentId: string;
  fileName: string;
  label: string;
  text: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: SourceReference[];
}
