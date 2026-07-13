import multer from "multer";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
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

/**
 * Wraps Multer's callback-based single-file middleware so that upload
 * failures (wrong file type, oversized file) are surfaced as a clean
 * `400 Bad Request` instead of falling through to the generic 500 error
 * handler, which Multer's callback API would otherwise trigger.
 */
export function createUploadHandler(fieldName: string) {
  const middleware = uploadMiddleware.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error: unknown) => {
      if (error instanceof multer.MulterError || error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }

      next();
    });
  };
}

export function getFileTypeFromMime(mimeType: string): DocumentFileType {
  const fileType = allowedMimeTypes[mimeType];

  if (!fileType) {
    throw new Error("Unsupported file type");
  }

  return fileType;
}
