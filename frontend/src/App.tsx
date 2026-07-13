import { DocumentList } from "./components/DocumentList/DocumentList";
import { DocumentUpload } from "./components/DocumentUpload/DocumentUpload";
import { ChatWindow } from "./components/Chat/ChatWindow";
import { useChat } from "./hooks/useChat";
import { useDocuments } from "./hooks/useDocuments";

export const App = () => {
  const {
    documents,
    isLoading,
    isUploading,
    error: documentsError,
    upload,
    remove,
  } = useDocuments();
  const { messages, isSending, error: chatError, sendMessage } = useChat();

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-900">DocBot</h1>
        <p className="text-sm text-slate-500">
          Your HR document assistant
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 space-y-4 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <DocumentUpload isUploading={isUploading} onUpload={upload} />
          {documentsError && (
            <p className="text-xs text-red-600">{documentsError}</p>
          )}
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Documents
            </h2>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              onDelete={remove}
            />
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          {chatError && (
            <p className="px-4 pt-2 text-xs text-red-600">{chatError}</p>
          )}
          <ChatWindow
            messages={messages}
            isSending={isSending}
            onSend={sendMessage}
          />
        </main>
      </div>
    </div>
  );
};
