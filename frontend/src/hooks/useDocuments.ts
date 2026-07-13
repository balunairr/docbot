import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../api/client";
import {
  deleteDocument,
  fetchDocuments,
  uploadDocument,
} from "../services/documentsService";
import type { DocumentSummary } from "../types";

export interface UseDocumentsResult {
  documents: DocumentSummary[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  upload: (file: File) => Promise<void>;
  remove: (documentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchDocuments();
      setDocuments(results);
    } catch (fetchError) {
      setError(toErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);

      try {
        await uploadDocument(file);
        await refresh();
      } catch (uploadError) {
        setError(toErrorMessage(uploadError));
      } finally {
        setIsUploading(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (documentId: string) => {
      setError(null);

      try {
        await deleteDocument(documentId);
        setDocuments((current) =>
          current.filter((document) => document.documentId !== documentId)
        );
      } catch (deleteError) {
        setError(toErrorMessage(deleteError));
      }
    },
    []
  );

  return { documents, isLoading, isUploading, error, upload, remove, refresh };
}
