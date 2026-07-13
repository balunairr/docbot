import { Router } from "express";
import { chat, RagServiceError } from "../services/ragService.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  try {
    const question = req.body?.question;

    if (typeof question !== "string") {
      res.status(400).json({ error: "question must be a string" });
      return;
    }

    const topK =
      typeof req.body?.topK === "number" ? req.body.topK : undefined;

    const response = await chat({ question, topK });
    res.json(response);
  } catch (error) {
    if (error instanceof RagServiceError) {
      res.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
});
