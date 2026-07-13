---

## TEMPLATE 6: Category E — Debug Azure OpenAI SDK Configuration Issues
## Works with: Claude
## Tags: debugging, azure-openai, sdk, configuration, endpoint, TypeScript, docbot

You are a senior backend engineer debugging an Azure OpenAI SDK integration in a Node.js TypeScript application.

This is DocBot, a RAG-based HR chatbot. Stack: Node.js + Express + TypeScript. Azure OpenAI is accessed via the openai npm package configured for Azure using baseURL and apiKey. The deployment names are gpt-5.1 (chat) and text-embedding-3-small (embeddings). The endpoint is stored in process.env.AZURE_OPENAI_ENDPOINT and the key in process.env.AZURE_OPENAI_API_KEY.

The Azure OpenAI calls are failing silently — no obvious error message, just a generic "Failed to generate response" caught by the error handler.

Diagnose the most common causes of silent Azure OpenAI SDK failures in this configuration and check for each one in src/services/aiService.ts:
1. Trailing slash on the endpoint URL causing a double-slash base URL.
2. Wrong or outdated API version for the model being used.
3. Passing temperature to a reasoning model (gpt-5.1 does not accept it).
4. Using max_tokens instead of max_completion_tokens for reasoning models.
5. Incorrect deployment name not matching the Azure portal exactly.

CONSTRAINTS:
- Do not suggest switching models or changing the SDK.
- Do not add console.log as the fix — identify and fix the root cause.
- Do not modify any file other than src/services/aiService.ts unless a type definition change is also required.

Output: (1) list of issues found with the exact line numbers, (2) corrected src/services/aiService.ts as a complete TypeScript file, (3) one-sentence explanation of what each fix does.

## ANNOTATION:
Primary component: Task — the 5-point checklist eliminates guesswork and ensures every common failure mode is checked systematically rather than randomly.
Failure pattern avoided: Pattern 1 — Too vague (a generic "fix my Azure connection" prompt would produce a generic checklist rather than targeted diagnosis of the actual file).
When to use this template: Any time Azure OpenAI calls fail silently in DocBot with no clear error message from the API itself.

---

## TEMPLATE 7: Category A — Add a New API Endpoint to the Express Backend
## Works with: Cursor
## Tags: backend, express, TypeScript, api, routes, docbot

You are a senior Node.js backend engineer adding a new endpoint to an existing Express + TypeScript application.

This is DocBot, a RAG-based HR chatbot. Stack: Node.js 20 + Express 5 + TypeScript. The backend follows a strict separation: src/routes/ contains thin route handlers (validate input, call service, return response — no business logic), and src/services/ contains all business logic. All routes are unauthenticated by design. Error handling goes through the global middleware in src/utils/errors.ts. File uploads use the createUploadHandler() from src/middleware/upload.ts.

Add the following endpoint: [DESCRIBE THE ENDPOINT — method, path, what it does, request format, response format].

CONSTRAINTS:
- Route handler must be thin — no business logic in the route file.
- Business logic goes in a new or existing service in src/services/.
- Follow the existing error handling pattern — throw typed errors, let the global middleware handle them.
- Do not add authentication — all routes are unauthenticated by design.
- Wire the new route into src/index.ts.
- Update docs/API.md with the new endpoint documentation.

Output: the new route file, any new or updated service file, the updated src/index.ts, and the updated docs/API.md section. No placeholders.

## ANNOTATION:
Primary component: Context — the strict route/service separation and existing patterns must be stated explicitly, otherwise AI defaults to putting business logic in the route handler which violates the architecture.
Failure pattern avoided: Pattern 7 — AI making architecture decisions (without constraints, AI would choose its own structure that conflicts with the existing codebase).
When to use this template: Any time a new backend endpoint needs to be added to DocBot.

---

## TEMPLATE 8: Category C — Plan a New Feature for DocBot
## Works with: Claude
## Tags: planning, feature, PRD, spec, docbot

You are a senior product manager reviewing a feature request for an existing production application.

This is DocBot, a RAG-based HR chatbot. Current stack: React + TypeScript frontend, Node.js/Express backend, Azure OpenAI (gpt-5.1 + text-embedding-3-small), LanceDB vector store. Current features: PDF/DOCX upload and ingestion, natural language Q&A with source citations, "I don't know" fallback, document management (list, delete, replace). No authentication — open access by design.

The proposed new feature is: [DESCRIBE THE FEATURE IN ONE SENTENCE].

Evaluate this feature request and produce:
1. Problem statement — what specific user pain does this solve?
2. Acceptance criteria — 3 to 5 specific, testable criteria for "done".
3. Implementation approach — which existing files/services need to change and what new files are needed.
4. Out of scope — at least 2 things explicitly excluded from this feature.
5. Risk — the single biggest technical or product risk and how to mitigate it.
6. Effort estimate — Small (half day), Medium (1-2 days), or Large (3+ days) with brief justification.

CONSTRAINTS:
- Do not suggest adding authentication — this is explicitly out of scope for DocBot.
- Do not suggest switching the tech stack.
- Keep the feature scoped to what can be built by a solo developer in the stated effort estimate.
- If the feature contradicts a locked architectural decision (no auth, single-turn only, LanceDB embedded), flag it explicitly rather than silently working around it.

Output: the 6-section feature plan as a structured document. Flag any architectural conflicts clearly before the plan.

## ANNOTATION:
Primary component: Constraints — without the explicit list of locked decisions, AI routinely suggests adding authentication or switching to a different database when planning new features, both of which would require a significant rewrite.
Failure pattern avoided: Pattern 3 — Missing negative constraint (without "do not suggest adding authentication", every feature plan comes back with an auth requirement bolted on).
When to use this template: Planning any new feature addition to DocBot after the MVP is shipped.
