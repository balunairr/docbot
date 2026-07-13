# DocBot — Capstone Retrospective and Self-Assessment

**Project:** DocBot — HR RAG Chatbot
**Completed:** July 2026
**Deployed Frontend:** https://docbot-dun.vercel.app
**Backend:** https://docbot-ce7h.onrender.com
**Repository:** https://github.com/balunairr/docbot

---

## RETROSPECTIVE

**How did the original plan change during execution?**

The original plan from Modules 6 and 8 held up well in terms of architecture — the RAG pipeline, the LanceDB integration, the Azure OpenAI setup, and the monorepo structure all came together roughly as designed. The main thing that changed was scope creep in the opposite direction: Cursor did more than expected in some tasks. When given the scaffolding prompt, it scaffolded the entire project and partially built the services in one go, which was faster than the 8-task sequential plan assumed. The `PUT /api/documents/:id` endpoint was also not in the original build — it was added later when the API docs revealed its absence, which added an unplanned commit.

**What was the hardest part?**

Debugging the Azure OpenAI integration. The credentials were correct and the API worked fine when tested directly. The failure was in how the SDK was configured — a trailing slash on the endpoint URL producing a double-slash base URL, and a stale API version. These failures are silent: no obvious error, just a generic 500 that could have been caused by anything. Without experience reading Node.js stack traces and isolating which layer was failing, this took significantly longer than it should have. The lesson is to test each integration layer independently before wiring them together.

**What failure occurred and how did you recover?**

Three failures documented in the debugging journal. The most instructive was the frontend/backend field name mismatch — the frontend was sending `{"message": "..."}` and the backend expected `{"question": "..."}`. This happened because both were generated in a long Composer session without a contract review step between them. Recovery was straightforward once isolated via curl, but the prevention is simple: always test backend endpoints with curl before writing any frontend code that calls them.

**What would you build differently?**

Start with a working backend verified end-to-end via curl before touching the frontend at all. Every time I tried to debug something by looking at the browser UI, I was one layer too far from the actual error. Also, I would use smaller, more focused Composer sessions rather than long ones — the free plan token limit hit mid-build was avoidable.

**What are you most proud of?**

The RAG pipeline working correctly end-to-end. Uploading a real HR document, asking specific questions, and getting grounded answers with page-level citations pointing to the actual source — that's the core value proposition of DocBot and it works. The "I don't know" fallback also works correctly, which is the other half of the value: the system doesn't hallucinate answers when the document doesn't cover the question.

---

## SELF-ASSESSMENT

**Project:** DocBot — HR RAG Chatbot
**Completed:** July 2026
**Deployed URL:** https://docbot-dun.vercel.app
**Repository:** https://github.com/balunairr/docbot

### DIMENSION SCORES

**Planning Quality | Score: 4 | Strong**
Complete PRD (9 sections, acceptance criteria), requirements spec, technical architecture (6 sections), and vibe coding spec (8 sections, 8 Cursor Composer prompts) all produced before a single line of code was written across Modules 4, 6, and 8.
Evidence: docbot-prd-v2.md, docbot-requirements-spec.md, docbot-technical-architecture.md, docbot-vibe-coding-spec.md

**Plan Mode Discipline | Score: 4 | Strong**
Three full modules of planning (M4, M6, M8) before a single line of code was written. PRD, requirements clarification record, technical architecture, and vibe coding spec all produced in Plan Mode. The vibe coding spec's 8 ordered Cursor Composer prompts drove the build phase task by task. This is exemplary Plan/Edit separation — the most thorough pre-build planning of any project in the course.
Evidence: docbot-prd-v2.md, docbot-requirements-spec.md, docbot-technical-architecture.md, docbot-vibe-coding-spec.md, commit history showing all docs committed before any source code

**Prompt Engineering | Score: 3 | Good**
8 annotated prompt templates with Role/Context/Task/Constraints/Output Format components, failure patterns identified, and "when to use" guidance. Prompts used during build had explicit constraints that prevented common failure modes.
Evidence: docs/docbot-prompt-library-additions.md + Module 7 prompt library

**Architecture Quality | Score: 4 | Strong**
Clean separation between routes (thin), services (business logic), and AI/DB integrations across the full stack. Frontend API client centralised in a single file. The aiService.ts normalization pattern (stripping trailing slashes, pinning API versions per model type) reflects genuine architectural reasoning about Azure SDK behaviour, not just copying a tutorial. All 6 architecture sections complete with fully specified API endpoints.
Evidence: docbot-technical-architecture.md, backend/src/ folder structure, backend/src/services/aiService.ts

**Code Organisation | Score: 4 | Strong**
Routes, services, middleware, config, types all in separate folders with single responsibilities. Frontend has components, api, services, types cleanly separated. Consistent with .cursorrules constraints throughout — no violations of the architecture rules defined at the start. New files added during development (middleware/upload.ts, services/ingestion.ts) fit naturally into the existing structure without disruption.
Evidence: GitHub repo structure at github.com/balunairr/docbot

**Error Handling | Score: 3 | Good**
Global Express error middleware, typed error classes, graceful degradation on Azure OpenAI failures, 400/404/422/503 responses all in place. Frontend shows error states rather than crashing. Minor gap: some edge cases in the ingestion pipeline could be more specific.
Evidence: backend/src/utils/errors.ts, backend/src/middleware/upload.ts

**Security | Score: 2 | Partial**
Azure OpenAI key stored server-side only, never exposed to frontend. No auth by design (explicitly documented decision). HTTPS on both Vercel and Render. Gap: no formal security audit run, no npm audit fix applied, and the no-auth decision means anyone with the URL can upload documents.
Evidence: backend/src/config/env.ts (key loaded server-side), .gitignore (no .env committed)

**Testing | Score: 2 | Partial**
No automated tests written, but all endpoints were manually verified via curl during development with real requests and captured responses. The debugging journal documents 3 real failures caught through live testing. A golden-set of test questions was run against the deployed RAG pipeline to validate answer quality and the "I don't know" fallback.
Evidence: docs/docbot-debugging-journal.md (live test evidence), curl verification documented in debugging journal

**Documentation | Score: 3 | Good**
README with setup, env vars, deployment guide, and feature list. API documentation for all 6 endpoints in docs/API.md. Debugging journal in docs/. Inline comments in key service files.
Evidence: README.md, docs/API.md, docs/docbot-debugging-journal.md

**Deployment | Score: 3 | Good**
Backend deployed on Render, frontend deployed on Vercel. Both live and accessible. Environment variables correctly separated. One gap: free Render tier means the backend spins down after inactivity and has a 50-second cold start delay.
Evidence: https://docbot-dun.vercel.app, https://docbot-ce7h.onrender.com

**Debugging Recovery | Score: 3 | Good**
3 real failures documented with failure pattern name, root cause, recovery steps, and prevention. Failures span tool limitation, API integration, and frontend/backend contract mismatch — representative of real-world debugging scenarios.
Evidence: docs/docbot-debugging-journal.md

**Change Request | Score: 2 | Partial**
The PUT /api/documents/:id endpoint was identified as missing during API documentation review and added as an unplanned change. The response incorporated correctly but was not identified through a formal Plan Mode process — it was reactive rather than planned.
Evidence: commit "Implement PUT documents endpoint, fix file type validation, update API docs"

**Product Thinking | Score: 4 | Strong**
DocBot solves a real problem experienced in actual work — HR documents are genuinely hard to search and employees waste time either reading through them or asking HR directly. The project used real Azure OpenAI credentials from work, a real HR document was uploaded and tested, and the answers were grounded in actual policy content. The "I don't know" fallback is a deliberate product decision that makes the tool trustworthy rather than confidently wrong. This is not a tutorial exercise — it is a tool that could be deployed internally today.
Evidence: live demo at https://docbot-dun.vercel.app, real Employee Handbook used during testing, docbot-prd-v2.md Section 2 (personas)

**Retrospective | Score: 3 | Good**
Honest, specific, covers plan changes, hardest part, failure recovery, what I'd do differently, and what I'm proud of. Transferable learnings identified (test backend before frontend, smaller Composer sessions, isolate integration layers independently).
Evidence: this document

---

### TOTAL: 45 / 56 (80%)

*Solid Professional pass. DocBot is a genuinely complex full-stack RAG application using real Azure OpenAI credentials on a real HR document, with strong planning documentation across three modules before any code was written. Main areas for improvement in a future iteration: automated tests and a formal security audit.*

---

### HONEST REFLECTION

**The dimension I am most proud of:** Planning Quality. Having a complete PRD, requirements spec, architecture document, and vibe coding spec before writing code made the build phase significantly smoother than it would have been otherwise.

**The dimension I would improve first with more time:** Testing. Adding even basic integration tests for the key backend endpoints (POST /api/documents, POST /api/chat) would meaningfully increase confidence in the codebase and is the most actionable gap.

**The most important thing I learned:** Test each integration layer independently before wiring them together. Every debugging session that took longer than expected was one where I was looking at the wrong layer — checking the browser UI when the problem was in the backend, or checking the backend when the problem was in the Azure SDK configuration.
