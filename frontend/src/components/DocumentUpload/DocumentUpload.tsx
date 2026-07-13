import { useRef, type ChangeEvent } from "react";

export interface DocumentUploadProps {
  isUploading: boolean;
  onUpload: (file: File) => void;
}

const ACCEPTED_EXTENSIONS = ".pdf,.docx";

export const DocumentUpload = ({
  isUploading,
  onUpload,
}: DocumentUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onUpload(file);
    }

    event.target.value = "";
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {isUploading ? "Uploading…" : "Upload PDF or DOCX"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Accepted formats: PDF, DOCX
      </p>
    </div>
  );
};
