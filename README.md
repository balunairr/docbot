# DocBot

DocBot is a Retrieval-Augmented Generation (RAG) chatbot that answers questions about your company's HR documents. Upload PDF or DOCX files (employee handbooks, leave policies, benefits guides, etc.) and ask DocBot natural-language questions — it retrieves the most relevant passages from your documents and generates a grounded answer with source citations, so employees get accurate answers instead of guesswork.

## What it does

1. **Ingest** — Upload a PDF or DOCX. DocBot extracts text page-by-page (PDF) or section-by-section (DOCX), splits it into overlapping chunks, generates embeddings, and stores everything in a local vector database.
2. **Ask** — Type a question in the chat UI.
3. **Retrieve** — DocBot embeds your question and finds the most semantically similar chunks across all uploaded documents.
4. **Answer** — Those chunks are passed to an LLM as context, which generates an answer grounded strictly in your documents — citing the source file and page/section, or honestly saying it doesn't know if the answer isn't in the documents.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 |
| Backend | Node.js 20 + Express + TypeScript (strict mode) |
| Vector store | [LanceDB](https://lancedb.com/) (`@lancedb/lancedb`) — embedded, no separate DB server required |
| LLM | Azure OpenAI — `gpt-5.1` (chat/reasoning) |
| Embeddings | Azure OpenAI — `text-embedding-3-small` |
| Document parsing | `pdfjs-dist` (PDF), `mammoth` (DOCX) |
| File uploads | Multer |

## Project structure

```
docbot/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/env.ts     # Validates required env vars at startup
│   │   ├── routes/           # Thin HTTP handlers (health, documents, chat)
│   │   ├── middleware/       # Upload handling, error handling
│   │   ├── services/         # RAG pipeline: extraction, chunking, embeddings,
│   │   │                     # vector store, ingestion, chat
│   │   └── types/            # Shared backend TypeScript interfaces
│   ├── data/
│   │   ├── lancedb/          # LanceDB storage (persisted vectors)
│   │   └── uploads/          # Temporary file storage during ingestion
│   └── .env.example
└── frontend/                 # React + Vite UI
    ├── src/
    │   ├── api/client.ts     # Base fetch wrapper (reads VITE_API_URL)
    │   ├── services/         # Typed API calls (documents, chat)
    │   ├── hooks/             # useDocuments, useChat
    │   ├── components/       # DocumentUpload, DocumentList, Chat
    │   └── types/             # Shared frontend TypeScript interfaces
    └── .env.example
```

## Prerequisites

- **Node.js 20+** and npm
- **An Azure OpenAI resource** with two model deployments:
  - A chat/reasoning model (e.g. `gpt-5.1`)
  - An embedding model (e.g. `text-embedding-3-small`)
- Your Azure OpenAI **endpoint URL** and **API key** (found in the Azure AI Foundry portal for your resource)

## Local setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url> docbot
   cd docbot
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Configure the backend environment**

   ```bash
   cp .env.example .env
   ```

   Open `backend/.env` and fill in your Azure OpenAI endpoint, API key, and deployment names (see [Environment variables](#environment-variables) below).

4. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

5. **(Optional) Configure the frontend environment**

   Only needed if your backend isn't running on the default `http://localhost:3001`:

   ```bash
   cp .env.example .env
   ```

   Edit `frontend/.env` and set `VITE_API_URL` to your backend's URL.

> **Note:** The contents of `backend/data/lancedb/` and `backend/data/uploads/` are gitignored — LanceDB's vector store files and uploaded documents are never committed. Only `.gitkeep` placeholders are tracked, so the empty folders are still present right after cloning. LanceDB creates its table files automatically the first time you upload a document; no manual setup is needed.

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|--------------|
| `PORT` | No (default `3001`) | Port the Express server listens on |
| `AZURE_OPENAI_ENDPOINT` | Yes | Your Azure OpenAI / AI Foundry resource endpoint, e.g. `https://your-resource.services.ai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | Yes | API key for your Azure OpenAI resource |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | Yes | Deployment name of your chat/reasoning model (e.g. `gpt-5.1`) |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Yes | Deployment name of your embedding model (e.g. `text-embedding-3-small`) |
| `LANCEDB_PATH` | Yes | Filesystem path where LanceDB stores vector data (e.g. `./data/lancedb`) |
| `UPLOADS_PATH` | Yes | Filesystem path for temporary uploaded files (e.g. `./data/uploads`) |

The backend validates all required variables at startup and throws a clear error listing anything missing.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|--------------|
| `VITE_API_URL` | No (default `http://localhost:3001`) | Base URL of the backend API. Required in production deployments. |

## How to run locally

Run both servers in separate terminals.

**Terminal 1 — backend**

```bash
cd backend
npm run dev
```

The API starts at `http://localhost:3001`. Verify it's up:

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

The UI starts at `http://localhost:5173`. Open it in your browser, upload a document, and start asking questions.

### Scripts reference

**Backend**

| Script | Description |
|--------|--------------|
| `npm run dev` | Start dev server with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run the compiled production server (`node dist/index.js`) |

**Frontend**

| Script | Description |
|--------|--------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |

## Features

- **Document upload** — Upload PDF or DOCX files via the sidebar. Files are parsed, chunked, embedded, and indexed automatically; the raw file is deleted from disk once ingestion completes.
- **RAG-powered Q&A** — Ask questions in plain English. DocBot retrieves the most relevant chunks across all uploaded documents and generates an answer grounded in that context.
- **Source citations** — Every answer includes the source file name and the page (PDF) or section heading (DOCX) each supporting chunk came from, so you can verify the answer against the original document.
- **"I don't know" fallback** — If the uploaded documents don't contain enough information to answer a question, DocBot says so explicitly and suggests contacting HR, rather than fabricating an answer.
- **Document management** — View all uploaded documents with chunk counts and upload dates; delete a document (and its vectors) at any time.

## Deployment

### Backend — Render

1. Create a new **Web Service** on [Render](https://render.com), pointing at this repository with root directory `backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Attach a **persistent disk** (e.g. mounted at `/data`) so LanceDB and uploaded files survive restarts and redeploys. Without persistent storage, all ingested documents are lost on every deploy.
5. Set environment variables in the Render dashboard:
   - `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_CHAT_DEPLOYMENT`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT`
   - `LANCEDB_PATH=/data/lancedb`
   - `UPLOADS_PATH=/data/uploads`
   - `PORT` (Render sets this automatically; the app already reads `process.env.PORT`)

### Frontend — Vercel

1. Import this repository into [Vercel](https://vercel.com) and set the project root to `frontend`.
2. Framework preset: **Vite**.
3. Build command: `npm run build`; output directory: `dist`.
4. Set the environment variable in the Vercel project settings:
   - `VITE_API_URL=https://<your-backend>.onrender.com`
5. Redeploy — `VITE_API_URL` is inlined at build time, so it must be set **before** the build runs (setting it after a build won't take effect until the next rebuild).
