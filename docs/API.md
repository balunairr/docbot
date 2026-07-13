# DocBot API Documentation

## Overview

- **Base URL (local):** `http://localhost:3001`
- **Base URL (production):** the URL of your deployed backend (e.g. `https://your-backend.onrender.com`)
- **Content type:** All JSON request/response bodies use `Content-Type: application/json`, except document upload which uses `multipart/form-data`.
- **Authentication:** None. All routes are unauthenticated by design — this API is intended to run behind a private/internal deployment. Do not expose it publicly without adding an auth layer.

All endpoints are mounted under the `/api` prefix.

| Method | Path | Description |
|--------|------|--------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/documents` | List ingested documents |
| `POST` | `/api/documents` | Upload and ingest a new document |
| `PUT` | `/api/documents/:id` | Replace an existing document's content |
| `DELETE` | `/api/documents/:id` | Delete a document and its vectors |
| `POST` | `/api/chat` | Ask a question (RAG chat) |

---

## `GET /api/health`

Health check used to verify the backend is running and reachable.

- **Auth required:** None

### Request

No headers, params, or body required.

```bash
curl http://localhost:3001/api/health
```

### Success response

**`200 OK`**

```json
{
  "status": "ok"
}
```

### Error responses

None. This endpoint has no failure paths.

---

## `GET /api/documents`

Lists all documents that have been ingested into the vector store, with one entry per document (aggregated across all of its chunks).

- **Auth required:** None

### Request

| | |
|---|---|
| Headers | None required |
| Params | None |
| Body | None |

```bash
curl http://localhost:3001/api/documents
```

### Success response

**`200 OK`**

```json
{
  "documents": [
    {
      "documentId": "a987908a-6feb-4c46-aace-154a65a81b3c",
      "fileName": "Employee Handbook_Offshore.pdf",
      "fileType": "pdf",
      "chunkCount": 57,
      "createdAt": "2026-07-13T14:13:48.195Z"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|--------------|
| `documentId` | `string` | UUID assigned to the document at ingestion time |
| `fileName` | `string` | Original uploaded file name |
| `fileType` | `"pdf" \| "docx"` | Detected file type |
| `chunkCount` | `number` | Number of text chunks stored for this document |
| `createdAt` | `string` (ISO 8601) | Timestamp when the document was ingested |

Returns `{ "documents": [] }` if no documents have been uploaded yet.

### Error responses

| Status | Body | When |
|--------|------|------|
| `500 Internal Server Error` | `{ "error": "Failed to list documents" }` | The vector store (LanceDB) could not be read |

---

## `POST /api/documents`

Uploads a PDF or DOCX file and runs it through the full ingestion pipeline: text extraction → chunking → embedding → storage in LanceDB. The uploaded file is deleted from disk once ingestion completes (or fails).

- **Auth required:** None

### Request

| | |
|---|---|
| Headers | `Content-Type: multipart/form-data` (set automatically by browsers/curl when using `-F`) |
| Params | None |
| Body | `multipart/form-data` with a single field named `file` |

**Constraints:**
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
- Maximum file size: 10 MB

```bash
curl -X POST http://localhost:3001/api/documents \
  -F "file=@handbook.pdf;type=application/pdf"
```

### Success response

**`201 Created`**

```json
{
  "documentId": "a987908a-6feb-4c46-aace-154a65a81b3c",
  "fileName": "handbook.pdf",
  "fileType": "pdf",
  "chunkCount": 57
}
```

| Field | Type | Description |
|-------|------|--------------|
| `documentId` | `string` | UUID assigned to the newly ingested document |
| `fileName` | `string` | Original uploaded file name |
| `fileType` | `"pdf" \| "docx"` | Detected file type |
| `chunkCount` | `number` | Number of chunks generated and stored |

### Error responses

| Status | Body | When |
|--------|------|------|
| `400 Bad Request` | `{ "error": "A file is required" }` | No `file` field was included in the form data |
| `400 Bad Request` | `{ "error": "Only PDF and DOCX files are supported" }` | The uploaded file's MIME type is not PDF or DOCX |
| `400 Bad Request` | `{ "error": "File too large" }` | The uploaded file exceeds the 10 MB size limit |
| `422 Unprocessable Entity` | `{ "error": "No extractable text found in document: <fileName>" }` | The file parsed successfully but contained no extractable text (e.g. a scanned/image-only PDF) |
| `422 Unprocessable Entity` | `{ "error": "Failed to ingest document: <fileName>" }` | Extraction, chunking, embedding, or storage failed partway through |

---

## `PUT /api/documents/:id`

Replaces the content of an **existing** document in place: deletes all of its current chunks/vectors from LanceDB, then re-runs the full ingestion pipeline (extraction → chunking → embedding → storage) against the newly uploaded file. The document keeps the same `id` throughout — only its content, chunk count, and last-updated timestamp change.

If ingestion of the new file fails for any reason (unreadable file, no extractable text, embedding failure), the document's existing chunks are **not** deleted — the old content remains searchable and intact. The old chunks are only removed once the new file has been successfully extracted, chunked, and embedded.

- **Auth required:** None

### Request

| | |
|---|---|
| Headers | `Content-Type: multipart/form-data` (set automatically by browsers/curl when using `-F`) |
| Params | `id` (path parameter, required) — the `documentId` of the document to replace |
| Body | `multipart/form-data` with a single field named `file` |

**Constraints:**
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
- Maximum file size: 10 MB
- The replacement file may be a different file type than the original (e.g. replacing a `.pdf` with a `.docx`) — the document's `fileType` is updated to match the new file.

```bash
curl -X PUT http://localhost:3001/api/documents/a987908a-6feb-4c46-aace-154a65a81b3c \
  -F "file=@handbook-v2.pdf;type=application/pdf"
```

### Success response

**`200 OK`**

```json
{
  "id": "a987908a-6feb-4c46-aace-154a65a81b3c",
  "filename": "handbook-v2.pdf",
  "last_updated_date": "2026-07-13T15:02:11.483Z",
  "chunk_count": 61
}
```

| Field | Type | Description |
|-------|------|--------------|
| `id` | `string` | The document's UUID (unchanged from before the update) |
| `filename` | `string` | Original file name of the newly uploaded replacement file |
| `last_updated_date` | `string` (ISO 8601) | Timestamp of this update |
| `chunk_count` | `number` | Number of chunks generated and stored for the new content |

> **Note on field naming:** this endpoint's response uses `id` / `filename` / `last_updated_date` / `chunk_count` (snake_case for the latter two), which differs from the camelCase (`documentId` / `fileName` / `createdAt` / `chunkCount`) used by every other endpoint in this API. This is intentional, matching the exact response contract specified for this endpoint. Be careful not to assume the same field names as `GET /api/documents` or `POST /api/documents` when integrating against `PUT`.

### Error responses

| Status | Body | When |
|--------|------|------|
| `400 Bad Request` | `{ "error": "A file is required" }` | No `file` field was included in the form data |
| `400 Bad Request` | `{ "error": "Only PDF and DOCX files are supported" }` | The uploaded file's MIME type is not PDF or DOCX |
| `400 Bad Request` | `{ "error": "File too large" }` | The uploaded file exceeds the 10 MB size limit |
| `404 Not Found` | `{ "error": "Document not found: <id>" }` | No document with the given `id` exists in the vector store |
| `422 Unprocessable Entity` | `{ "error": "No extractable text found in document: <fileName>" }` | The replacement file parsed successfully but contained no extractable text |
| `422 Unprocessable Entity` | `{ "error": "Failed to ingest document: <fileName>" }` | Extraction, chunking, embedding, or storage failed partway through — the document's original chunks are preserved |

---

## `DELETE /api/documents/:id`

Deletes a document and all of its associated chunks/vectors from the vector store.

- **Auth required:** None

### Request

| | |
|---|---|
| Headers | None required |
| Params | `id` (path parameter, required) — the `documentId` returned by `POST /api/documents` or `GET /api/documents` |
| Body | None |

```bash
curl -X DELETE http://localhost:3001/api/documents/a987908a-6feb-4c46-aace-154a65a81b3c
```

### Success response

**`204 No Content`**

No response body.

### Error responses

| Status | Body | When |
|--------|------|------|
| `404 Not Found` | `{ "error": "Document not found: <id>" }` | No document with the given `id` exists in the vector store |
| `500 Internal Server Error` | `{ "error": "Failed to delete document: <id>" }` | Deletion from the vector store failed unexpectedly |

---

## `POST /api/chat`

Runs a Retrieval-Augmented Generation query: embeds the question, retrieves the most relevant chunks across all ingested documents, and generates an answer grounded in that context using Azure OpenAI.

- **Auth required:** None

### Request

| | |
|---|---|
| Headers | `Content-Type: application/json` |
| Params | None |
| Body | JSON object (see below) |

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `question` | `string` | Yes | The user's natural-language question |
| `topK` | `number` | No (default `5`) | Number of top-matching chunks to retrieve as context |

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How many days of annual leave am I entitled to?", "topK": 5}'
```

### Success response

**`200 OK`**

```json
{
  "answer": "Based on the leave policy, full-time employees are entitled to ...",
  "sources": [
    {
      "documentId": "a987908a-6feb-4c46-aace-154a65a81b3c",
      "fileName": "Employee Handbook_Offshore.pdf",
      "label": "Page 12",
      "text": "Annual Leave Policy ...",
      "score": 1.42
    }
  ]
}
```

| Field | Type | Description |
|-------|------|--------------|
| `answer` | `string` | The generated answer, grounded in the retrieved context. If the documents don't contain enough information, the model responds saying it doesn't know and suggests contacting HR. |
| `sources` | `array` | The chunks used as context for the answer (may be empty if no documents have been ingested) |
| `sources[].documentId` | `string` | UUID of the source document |
| `sources[].fileName` | `string` | Original file name of the source document |
| `sources[].label` | `string` | Page number (PDF, e.g. `"Page 12"`) or section heading (DOCX) the chunk came from |
| `sources[].text` | `string` | The raw chunk text used as context |
| `sources[].score` | `number` | Vector distance score from the similarity search (lower is more similar) |

### Error responses

| Status | Body | When |
|--------|------|------|
| `400 Bad Request` | `{ "error": "question must be a string" }` | `question` is missing or not a string |
| `400 Bad Request` | `{ "error": "Question must not be empty" }` | `question` is an empty or whitespace-only string |
| `400 Bad Request` | `{ "error": "Failed to generate chat response" }` | Embedding, vector search, or the Azure OpenAI chat completion call failed |
| `500 Internal Server Error` | `{ "error": "Internal server error" }` | An unexpected error occurred outside the RAG service (rare) |

---

## General error format

All error responses across every endpoint share a consistent JSON shape:

```json
{
  "error": "<human-readable message>"
}
```
