import { AzureOpenAI } from "openai";
import { env } from "../config/env.js";
import type { ChatMessageInput } from "../types/index.js";

const AZURE_EMBEDDING_API_VERSION = "2024-08-01-preview";
const AZURE_CHAT_API_VERSION = "2025-01-01-preview";
const EMBEDDING_BATCH_SIZE = 16;
const DEFAULT_CHAT_MAX_TOKENS = 1024;
const DEFAULT_REASONING_EFFORT = "low";

export class AiServiceError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AiServiceError";
    this.cause = cause;
  }
}

// The AzureOpenAI SDK builds baseURL as `${endpoint}/openai`, so a trailing
// slash on the configured endpoint would produce a double slash and a 404.
function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

function createEmbeddingClient(): AzureOpenAI {
  return new AzureOpenAI({
    apiKey: env.azureOpenAiApiKey,
    apiVersion: AZURE_EMBEDDING_API_VERSION,
    endpoint: normalizeEndpoint(env.azureOpenAiEndpoint),
    deployment: env.azureOpenAiEmbeddingDeployment,
  });
}

function createChatClient(): AzureOpenAI {
  return new AzureOpenAI({
    apiKey: env.azureOpenAiApiKey,
    apiVersion: AZURE_CHAT_API_VERSION,
    endpoint: normalizeEndpoint(env.azureOpenAiEndpoint),
    deployment: env.azureOpenAiChatDeployment,
  });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const client = createEmbeddingClient();
  const embeddings: number[][] = [];

  try {
    for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
      const batch = texts.slice(index, index + EMBEDDING_BATCH_SIZE);
      const response = await client.embeddings.create({
        model: env.azureOpenAiEmbeddingDeployment,
        input: batch,
      });

      const sorted = [...response.data].sort(
        (left, right) => left.index - right.index
      );

      for (const item of sorted) {
        embeddings.push(item.embedding);
      }
    }

    return embeddings;
  } catch (error) {
    throw new AiServiceError("Failed to generate embeddings", error);
  }
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);

  if (!embedding) {
    throw new AiServiceError("Embedding response was empty");
  }

  return embedding;
}

export async function generateChatCompletion(
  messages: ChatMessageInput[]
): Promise<string> {
  const client = createChatClient();

  try {
    const response = await client.chat.completions.create({
      model: env.azureOpenAiChatDeployment,
      messages,
      max_completion_tokens: DEFAULT_CHAT_MAX_TOKENS,
      reasoning_effort: DEFAULT_REASONING_EFFORT,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new AiServiceError("Chat completion returned no content");
    }

    return content;
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    throw new AiServiceError("Failed to generate chat completion", error);
  }
}
