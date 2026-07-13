import { useState, type FormEvent } from "react";
import type { ChatMessage } from "../../types";
import { MessageBubble } from "./MessageBubble";

export interface ChatWindowProps {
  messages: ChatMessage[];
  isSending: boolean;
  onSend: (content: string) => void;
}

export const ChatWindow = ({ messages, isSending, onSend }: ChatWindowProps) => {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.trim() || isSending) {
      return;
    }

    onSend(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ask a question about your uploaded HR documents.
          </p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {isSending && (
          <p className="text-sm text-slate-400">DocBot is thinking…</p>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-slate-200 p-4"
      >
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about your HR documents…"
          disabled={isSending}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          Send
        </button>
      </form>
    </div>
  );
};
