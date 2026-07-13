export type DocumentFileType = "pdf" | "docx";

export interface DocumentSummary {
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  chunkCount: number;
  createdAt: string;
}

export interface IngestDocumentInput {
  documentId?: string;
  fileName: string;
  filePath: string;
  fileType: DocumentFileType;
}

export interface IngestDocumentResult {
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  chunkCount: number;
}

export interface ChunkSearchResult {
  id: string;
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  text: string;
  label: string;
  chunkIndex: number;
  score: number;
}

export interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  question: string;
  topK?: number;
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

export interface DocumentChunkRecord {
  id: string;
  documentId: string;
  fileName: string;
  fileType: DocumentFileType;
  text: string;
  label: string;
  chunkIndex: number;
  vector: number[];
  createdAt: string;
}
