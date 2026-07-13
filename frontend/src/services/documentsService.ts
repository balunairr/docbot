import { apiClient } from "../api/client";
import type {
  DocumentListResponse,
  DocumentSummary,
  IngestDocumentResult,
} from "../types";

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const response = await apiClient<DocumentListResponse>("/api/documents");
  return response.documents;
}

export async function uploadDocument(
  file: File
): Promise<IngestDocumentResult> {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient<IngestDocumentResult>("/api/documents", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient<undefined>(`/api/documents/${documentId}`, {
    method: "DELETE",
  });
}
