import { Router } from "express";
import {
  getFileTypeFromMime,
  uploadMiddleware,
} from "../middleware/upload.js";
import { deleteDocument, ingestUploadedFile, IngestionError } from "../services/ingestion.js";
import { listDocuments } from "../services/vectorStore.js";

export const documentsRouter = Router();

documentsRouter.get("/", async (_req, res, next) => {
  try {
    const documents = await listDocuments();
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

documentsRouter.post(
  "/",
  uploadMiddleware.single("file"),
  async (req, res, next) => {
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
