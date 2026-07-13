import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { chunkText } from "./chunking.js";
import { embedTexts } from "./aiService.js";
import {
  extractDocument,
  type DocumentFileType,
} from "./extraction.js";
import {
  deleteDocumentChunks,
  getDocumentChunkCount,
  insertChunks,
} from "./vectorStore.js";
import type {
  DocumentChunkRecord,
  IngestDocumentInput,
  IngestDocumentResult,
} from "../types/index.js";

export class IngestionError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "IngestionError";
    this.cause = cause;
  }
}

export async function ingestDocument(
  input: IngestDocumentInput
): Promise<IngestDocumentResult> {
  const documentId = input.documentId ?? randomUUID();

  try {
    const blocks = await extractDocument(input.filePath, input.fileType);
    const chunks = await chunkText(blocks);

    if (chunks.length === 0) {
      throw new IngestionError(
        `No extractable text found in document: ${input.fileName}`
      );
    }

    const vectors = await embedTexts(chunks.map((chunk) => chunk.text));
    const updatedAt = new Date().toISOString();

    const records: DocumentChunkRecord[] = chunks.map((chunk, index) => ({
      id: randomUUID(),
      documentId,
      fileName: input.fileName,
      fileType: input.fileType,
      text: chunk.text,
      label: chunk.label,
      chunkIndex: index,
      vector: vectors[index] ?? [],
      createdAt: updatedAt,
    }));

    if (records.some((record) => record.vector.length === 0)) {
      throw new IngestionError("Embedding count did not match chunk count");
    }

    // Deleting first (rather than overwriting in place) keeps this function
    // correct for both first-time ingestion and re-ingestion of an existing
    // documentId: any stale chunks from a previous version of the document
    // are removed before the new chunks are inserted.
    await deleteDocumentChunks(documentId);
    await insertChunks(records);

    return {
      documentId,
      fileName: input.fileName,
      fileType: input.fileType,
      chunkCount: records.length,
      updatedAt,
    };
  } catch (error) {
    if (error instanceof IngestionError) {
      throw error;
    }

    throw new IngestionError(
      `Failed to ingest document: ${input.fileName}`,
      error
    );
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const chunkCount = await getDocumentChunkCount(documentId);

    if (chunkCount === 0) {
      throw new IngestionError(`Document not found: ${documentId}`);
    }

    await deleteDocumentChunks(documentId);
  } catch (error) {
    if (error instanceof IngestionError) {
      throw error;
    }

    throw new IngestionError(
      `Failed to delete document: ${documentId}`,
      error
    );
  }
}

export async function ingestUploadedFile(
  filePath: string,
  fileName: string,
  fileType: DocumentFileType,
  documentId?: string
): Promise<IngestDocumentResult> {
  try {
    const result = await ingestDocument({
      documentId,
      filePath,
      fileName,
      fileType,
    });

    await unlink(filePath).catch(() => undefined);

    return result;
  } catch (error) {
    await unlink(filePath).catch(() => undefined);

    if (error instanceof IngestionError) {
      throw error;
    }

    throw new IngestionError(
      `Failed to ingest uploaded file: ${fileName}`,
      error
    );
  }
}

/**
 * Replaces the content of an existing document: verifies the document
 * exists, then deletes its old chunks and re-runs the full ingestion
 * pipeline (extract, chunk, embed, store) against the new file.
 */
export async function updateDocument(
  documentId: string,
  filePath: string,
  fileName: string,
  fileType: DocumentFileType
): Promise<IngestDocumentResult> {
  try {
    const existingChunkCount = await getDocumentChunkCount(documentId);

    if (existingChunkCount === 0) {
      await unlink(filePath).catch(() => undefined);
      throw new IngestionError(`Document not found: ${documentId}`);
    }

    return await ingestUploadedFile(filePath, fileName, fileType, documentId);
  } catch (error) {
    if (error instanceof IngestionError) {
      throw error;
    }

    throw new IngestionError(
      `Failed to update document: ${documentId}`,
      error
    );
  }
}
