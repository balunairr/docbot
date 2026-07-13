import { useCallback, useState } from "react";
import { ApiError } from "../api/client";
import { sendChatMessage } from "../services/chatService";
import type { ChatMessage } from "../types";

export interface UseChatResult {
  messages: ChatMessage[];
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
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

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setIsSending(true);
    setError(null);

    try {
      const response = await sendChatMessage(trimmed);
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (sendError) {
      setError(toErrorMessage(sendError));
    } finally {
      setIsSending(false);
    }
  }, []);

  return { messages, isSending, error, sendMessage };
}
