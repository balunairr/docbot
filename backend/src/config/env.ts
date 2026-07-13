import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_API_KEY",
  "AZURE_OPENAI_CHAT_DEPLOYMENT",
  "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
  "LANCEDB_PATH",
  "UPLOADS_PATH",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

export interface EnvConfig {
  port: number;
  azureOpenAiEndpoint: string;
  azureOpenAiApiKey: string;
  azureOpenAiChatDeployment: string;
  azureOpenAiEmbeddingDeployment: string;
  lancedbPath: string;
  uploadsPath: string;
}

const missingVars: RequiredEnvVar[] = requiredEnvVars.filter(
  (key) => !process.env[key]?.trim()
);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join("\n")}\nCopy .env.example to .env and fill in the values.`
  );
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 3001,
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAiChatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!,
  azureOpenAiEmbeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT!,
  lancedbPath: process.env.LANCEDB_PATH!,
  uploadsPath: process.env.UPLOADS_PATH!,
};
