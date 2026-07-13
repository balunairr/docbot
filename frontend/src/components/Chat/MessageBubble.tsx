import type { ChatMessage } from "../../types";

export interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-800"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-slate-300/50 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sources
            </p>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <li
                  key={`${source.documentId}-${index}`}
                  className="text-xs text-slate-500"
                >
                  {source.fileName} · {source.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
