import { Router } from "express";
import {
  createUploadHandler,
  getFileTypeFromMime,
} from "../middleware/upload.js";
import {
  deleteDocument,
  ingestUploadedFile,
  IngestionError,
  updateDocument,
} from "../services/ingestion.js";
import { listDocuments } from "../services/vectorStore.js";

const handleFileUpload = createUploadHandler("file");

export const documentsRouter = Router();

documentsRouter.get("/", async (_req, res, next) => {
  try {
    const documents = await listDocuments();
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post("/", handleFileUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "A file is required" });
      return;
    }

    const fileType = getFileTypeFromMime(req.file.mimetype);
    const result = await ingestUploadedFile(
      req.file.path,
      req.file.originalname,
      fileType
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof IngestionError) {
      res.status(422).json({ error: error.message });
      return;
    }

    next(error);
  }
});

documentsRouter.put(
  "/:documentId",
  handleFileUpload,
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "A file is required" });
        return;
      }

      const documentId = String(req.params.documentId);
      const fileType = getFileTypeFromMime(req.file.mimetype);
      const result = await updateDocument(
        documentId,
        req.file.path,
        req.file.originalname,
        fileType
      );

      res.status(200).json({
        id: result.documentId,
        filename: result.fileName,
        last_updated_date: result.updatedAt,
        chunk_count: result.chunkCount,
      });
    } catch (error) {
      if (error instanceof IngestionError) {
        const statusCode = error.message.startsWith("Document not found")
          ? 404
          : 422;
        res.status(statusCode).json({ error: error.message });
        return;
      }

      next(error);
    }
  }
);

documentsRouter.delete("/:documentId", async (req, res, next) => {
  try {
    await deleteDocument(req.params.documentId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof IngestionError) {
      res.status(404).json({ error: error.message });
      return;
    }

    next(error);
  }
});
