import { apiClient } from "../api/client";
import type { ChatResponse } from "../types";

export async function sendChatMessage(
  question: string,
  topK?: number
): Promise<ChatResponse> {
  return apiClient<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ question, topK }),
  });
}
