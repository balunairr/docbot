import multer from "multer";
import path from "node:path";
import { env } from "../config/env.js";
import type { DocumentFileType } from "../types/index.js";

const allowedMimeTypes: Record<string, DocumentFileType> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.uploadsPath);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]+/g, "-");
    callback(null, `${Date.now()}-${safeBaseName}${extension}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes[file.mimetype]) {
      callback(new Error("Only PDF and DOCX files are supported"));
      return;
    }

    callback(null, true);
  },
});

export function getFileTypeFromMime(mimeType: string): DocumentFileType {
  const fileType = allowedMimeTypes[mimeType];

  if (!fileType) {
    throw new Error("Unsupported file type");
  }

  return fileType;
}
