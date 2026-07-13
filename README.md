# DocBot

A RAG-based HR document chatbot using Azure OpenAI and LanceDB.

## Project structure

```
docbot/
├── backend/   # Node.js + Express API
└── frontend/  # React + Vite UI
```

## Prerequisites

- Node.js 20+
- npm

## Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Azure OpenAI credentials and paths
npm install
npm run dev
```

The API runs at **http://localhost:3001** by default. Verify with:

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

### Backend scripts

| Script  | Description                          |
|---------|--------------------------------------|
| `dev`   | Start dev server with hot reload     |
| `build` | Compile TypeScript to `dist/`        |
| `start` | Run compiled production server       |

## Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The UI runs at **http://localhost:5173** by default.

### Frontend scripts

| Script    | Description                    |
|-----------|--------------------------------|
| `dev`     | Start Vite dev server          |
| `build`   | Type-check and build for prod  |
| `preview` | Preview production build       |

## Environment variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable                          | Description                              |
|-----------------------------------|------------------------------------------|
| `PORT`                            | API port (default: 3001)                 |
| `AZURE_OPENAI_ENDPOINT`           | Azure OpenAI resource endpoint           |
| `AZURE_OPENAI_API_KEY`            | Azure OpenAI API key                     |
| `AZURE_OPENAI_CHAT_DEPLOYMENT`    | Chat model deployment name               |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Embedding model deployment name        |
| `LANCEDB_PATH`                    | Path to LanceDB storage                  |
| `UPLOADS_PATH`                    | Path for uploaded PDF files              |

## Tech stack

- **Backend:** Node.js, Express, TypeScript, LanceDB (`@lancedb/lancedb`)
- **Frontend:** React 18, TypeScript, Vite
- **AI:** Azure OpenAI (embeddings + chat)
