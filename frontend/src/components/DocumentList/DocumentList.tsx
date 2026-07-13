import type { DocumentSummary } from "../../types";

export interface DocumentListProps {
  documents: DocumentSummary[];
  isLoading: boolean;
  onDelete: (documentId: string) => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const DocumentList = ({
  documents,
  isLoading,
  onDelete,
}: DocumentListProps) => {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading documents…</p>;
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No documents yet. Upload one to get started.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((document) => (
        <li
          key={document.documentId}
          className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {document.fileName}
            </p>
            <p className="text-xs text-slate-500">
              {document.fileType.toUpperCase()} · {document.chunkCount} chunks
              · {formatDate(document.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(document.documentId)}
            className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
            aria-label={`Delete ${document.fileName}`}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
};
