import { embedText, generateChatCompletion } from "./aiService.js";
import { searchChunks } from "./vectorStore.js";
import type { ChatRequest, ChatResponse, SourceReference } from "../types/index.js";

const DEFAULT_TOP_K = 5;
const SYSTEM_PROMPT = `You are DocBot, an HR document assistant.
Answer questions using only the provided context from company HR documents.
If the context does not contain enough information, say you do not know and suggest contacting HR.
Cite page numbers or section labels from the context when relevant.`;

export class RagServiceError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "RagServiceError";
    this.cause = cause;
  }
}

function buildContextBlock(sources: SourceReference[]): string {
  if (sources.length === 0) {
    return "No relevant document context was found.";
  }

  return sources
    .map(
      (source, index) =>
        `[Source ${index + 1} | ${source.fileName} | ${source.label}]\n${source.text}`
    )
    .join("\n\n");
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const trimmedMessage = request.question.trim();

  if (!trimmedMessage) {
    throw new RagServiceError("Question must not be empty");
  }

  const topK = request.topK ?? DEFAULT_TOP_K;

  try {
    const queryVector = await embedText(trimmedMessage);
    const matches = await searchChunks(queryVector, topK);

    const sources: SourceReference[] = matches.map((match) => ({
      documentId: match.documentId,
      fileName: match.fileName,
      label: match.label,
      text: match.text,
      score: match.score,
    }));

    const answer = await generateChatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Context:\n${buildContextBlock(sources)}\n\nQuestion: ${trimmedMessage}`,
      },
    ]);

    return {
      answer,
      sources,
    };
  } catch (error) {
    if (error instanceof RagServiceError) {
      throw error;
    }

    throw new RagServiceError("Failed to generate chat response", error);
  }
}
