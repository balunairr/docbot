import type { LabeledBlock } from "./extraction.js";

const DEFAULT_CHUNK_SIZE = 600;
const DEFAULT_OVERLAP = 0.12;
const WORDS_PER_TOKEN = 0.75;

export class ChunkingError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ChunkingError";
    this.cause = cause;
  }
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export interface TextChunk {
  text: string;
  label: string;
}

function estimateWordCountForTokens(tokenCount: number): number {
  if (tokenCount <= 0) {
    throw new ChunkingError("chunkSize must be greater than 0");
  }

  return Math.max(1, Math.floor(tokenCount / WORDS_PER_TOKEN));
}

function estimateOverlapWords(chunkSizeTokens: number, overlapRatio: number): number {
  if (overlapRatio < 0 || overlapRatio >= 1) {
    throw new ChunkingError("overlap must be between 0 (inclusive) and 1 (exclusive)");
  }

  const overlapTokens = chunkSizeTokens * overlapRatio;
  return Math.max(0, Math.floor(overlapTokens / WORDS_PER_TOKEN));
}

function splitIntoWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function chunkBlock(
  text: string,
  label: string,
  maxWords: number,
  overlapWords: number
): TextChunk[] {
  const words = splitIntoWords(text);

  if (words.length === 0) {
    return [];
  }

  if (words.length <= maxWords) {
    return [{ text: words.join(" "), label }];
  }

  const effectiveOverlap = Math.min(overlapWords, maxWords - 1);
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    chunks.push({
      text: words.slice(start, end).join(" "),
      label,
    });

    if (end >= words.length) {
      break;
    }

    const nextStart = end - effectiveOverlap;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}

export async function chunkText(
  blocks: LabeledBlock[],
  options: ChunkOptions = {}
): Promise<TextChunk[]> {
  try {
    const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
    const overlap = options.overlap ?? DEFAULT_OVERLAP;
    const maxWords = estimateWordCountForTokens(chunkSize);
    const overlapWords = estimateOverlapWords(chunkSize, overlap);

    const chunks: TextChunk[] = [];

    for (const block of blocks) {
      if (!block.text.trim()) {
        continue;
      }

      chunks.push(...chunkBlock(block.text, block.label, maxWords, overlapWords));
    }

    return chunks;
  } catch (error) {
    if (error instanceof ChunkingError) {
      throw error;
    }

    throw new ChunkingError("Failed to chunk text", error);
  }
}
