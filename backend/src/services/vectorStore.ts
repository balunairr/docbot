import * as lancedb from "@lancedb/lancedb";
import type { Connection, Table } from "@lancedb/lancedb";
import { env } from "../config/env.js";
import type {
  DocumentChunkRecord,
  DocumentFileType,
  DocumentSummary,
  ChunkSearchResult,
} from "../types/index.js";

const CHUNKS_TABLE = "document_chunks";

export class VectorStoreError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "VectorStoreError";
    this.cause = cause;
  }
}

let connectionPromise: Promise<Connection> | undefined;

async function getConnection(): Promise<Connection> {
  if (!connectionPromise) {
    connectionPromise = lancedb.connect(env.lancedbPath).catch((error) => {
      connectionPromise = undefined;
      throw new VectorStoreError("Failed to connect to LanceDB", error);
    });
  }

  return connectionPromise;
}

function escapePredicateValue(value: string): string {
  return value.replace(/'/g, "''");
}

async function getChunksTable(createIfMissing: boolean): Promise<Table | null> {
  const connection = await getConnection();
  const tableNames = await connection.tableNames();

  if (tableNames.includes(CHUNKS_TABLE)) {
    return connection.openTable(CHUNKS_TABLE);
  }

  if (!createIfMissing) {
    return null;
  }

  return null;
}

function toChunkRows(chunks: DocumentChunkRecord[]): Record<string, unknown>[] {
  return chunks.map((chunk) => ({ ...chunk }));
}

interface ChunkRow {
  id: string;
  documentId: string;
  fileName: string;
  fileType: string;
  text: string;
  label: string;
  chunkIndex: number;
  vector: number[];
  createdAt: string;
  _distance?: number;
}

function mapSearchResult(row: ChunkRow): ChunkSearchResult {
  return {
    id: row.id,
    documentId: row.documentId,
    fileName: row.fileName,
    fileType: row.fileType as DocumentFileType,
    text: row.text,
    label: row.label,
    chunkIndex: row.chunkIndex,
    score: row._distance ?? 0,
  };
}

export async function insertChunks(chunks: DocumentChunkRecord[]): Promise<void> {
  if (chunks.length === 0) {
    return;
  }

  try {
    const connection = await getConnection();
    const tableNames = await connection.tableNames();
    const rows = toChunkRows(chunks);

    if (!tableNames.includes(CHUNKS_TABLE)) {
      await connection.createTable(CHUNKS_TABLE, rows);
      return;
    }

    const table = await connection.openTable(CHUNKS_TABLE);
    await table.add(rows);
  } catch (error) {
    throw new VectorStoreError("Failed to insert document chunks", error);
  }
}

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  try {
    const table = await getChunksTable(false);

    if (!table) {
      return;
    }

    await table.delete(`documentId = '${escapePredicateValue(documentId)}'`);
  } catch (error) {
    throw new VectorStoreError(
      `Failed to delete chunks for document ${documentId}`,
      error
    );
  }
}

export async function searchChunks(
  queryVector: number[],
  limit: number
): Promise<ChunkSearchResult[]> {
  try {
    const table = await getChunksTable(false);

    if (!table) {
      return [];
    }

    const rows = (await table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray()) as ChunkRow[];

    return rows.map(mapSearchResult);
  } catch (error) {
    throw new VectorStoreError("Failed to search document chunks", error);
  }
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  try {
    const table = await getChunksTable(false);

    if (!table) {
      return [];
    }

    const rows = (await table
      .query()
      .select(["documentId", "fileName", "fileType", "createdAt"])
      .toArray()) as Pick<
      ChunkRow,
      "documentId" | "fileName" | "fileType" | "createdAt"
    >[];

    const summaries = new Map<string, DocumentSummary>();

    for (const row of rows) {
      const existing = summaries.get(row.documentId);

      if (existing) {
        existing.chunkCount += 1;
        continue;
      }

      summaries.set(row.documentId, {
        documentId: row.documentId,
        fileName: row.fileName,
        fileType: row.fileType as DocumentFileType,
        chunkCount: 1,
        createdAt: row.createdAt,
      });
    }

    return [...summaries.values()].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );
  } catch (error) {
    throw new VectorStoreError("Failed to list documents", error);
  }
}

export async function getDocumentChunkCount(
  documentId: string
): Promise<number> {
  try {
    const table = await getChunksTable(false);

    if (!table) {
      return 0;
    }

    const rows = (await table
      .query()
      .where(`documentId = '${escapePredicateValue(documentId)}'`)
      .select(["id"])
      .toArray()) as Pick<ChunkRow, "id">[];

    return rows.length;
  } catch (error) {
    throw new VectorStoreError(
      `Failed to count chunks for document ${documentId}`,
      error
    );
  }
}
