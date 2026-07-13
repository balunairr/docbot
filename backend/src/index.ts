import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { chatRouter } from "./routes/chat.js";
import { documentsRouter } from "./routes/documents.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`DocBot backend listening on http://localhost:${env.port}`);
});
