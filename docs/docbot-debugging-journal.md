# DocBot — Debugging Journal

*3 real failures encountered during the build, documented with failure pattern, recovery, and prevention.*

---

## Entry 1 — Azure OpenAI Trailing Slash Causing Silent 404

**What happened:**
The chat endpoint was returning `"Failed to generate chat response"` on every request. The Azure OpenAI credentials were confirmed working (tested directly in Python via requests), the backend was running, and the LanceDB retrieval was working. But every call to the chat completions endpoint was silently failing.

**Failure pattern identified:**
Pattern 6 — Missing tech stack / environment detail. The `.env` file had the Azure endpoint set as `https://balu-mha04zn5-eastus2.services.ai.azure.com/` (with a trailing slash). The Azure OpenAI SDK builds the base URL as `${endpoint}/openai`, which produced a double-slash URL `...azure.com//openai`. This is a valid enough URL that it doesn't throw an obvious error — it just returns a 404 or connection failure that gets swallowed by the generic error handler.

**How I recovered:**
Confirmed Azure credentials were fine by calling the API directly from Python. This isolated the issue to the Node.js SDK configuration, not the credentials. Checked `src/services/aiService.ts` and found the endpoint was being passed directly to the AzureOpenAI SDK constructor without stripping the trailing slash. Added a `normalizeEndpoint()` function to strip trailing slashes before passing to the client. Also found the API version was stale — updated to `2025-01-01-preview` for the chat completions client.

**What I would do differently:**
Always test Azure OpenAI connectivity from Node.js specifically before writing any application code — not just from Python. A simple `curl` or one-file Node script hitting the endpoint directly would have caught this in minutes rather than after building the full RAG pipeline.

---

## Entry 2 — Frontend/Backend Field Name Mismatch

**What happened:**
After the Azure fix, the chat endpoint was still returning errors for some requests. Running `curl` with `{"question": "..."}` returned `{"error": "message must be a string"}`. The frontend was sending `{"question": "..."}` but the backend was validating for `"message"`.

**Failure pattern identified:**
Pattern 5 — Compound task with 'and'. During the scaffolding phase, Cursor built the frontend and backend in a single long session. The frontend services were generated expecting one field name and the backend route handler was generated expecting another. Because both were generated quickly in sequence without a contract review step between them, the mismatch went undetected until the first real end-to-end test.

**How I recovered:**
Used `curl` to isolate exactly which layer was rejecting the request and what field name it expected. Found both `src/routes/chat.ts` and `src/services/chatService.ts` and updated them to consistently use `"question"` as the field name, matching the spec. The fix was 3 lines across 2 files.

**What I would do differently:**
After scaffolding, always test the backend endpoints with `curl` before touching the frontend. This creates a verified contract — you know exactly what the backend accepts — before writing the frontend code that calls it. The Module 10 lesson about testing each layer independently before wiring them together is directly applicable here.

---

## Entry 3 — Cursor Free Plan Token Limit Mid-Build

**What happened:**
Mid-way through Task 2 (extraction and chunking services), Cursor's Composer stopped with the error: `"You've hit your usage limit — Get Cursor Pro for more Agent usage"`. The background tasks were still running and couldn't be cancelled, and the session was stuck showing "Will resume when background work finishes" indefinitely.

**Failure pattern identified:**
Pattern 7 — Circular repair loop / tool limitation. The Composer session had been running for a while with multiple back-and-forth iterations, consuming agent tokens faster than expected on the free plan. The free plan's agent usage limit is significantly lower than what a real build session requires.

**How I recovered:**
Upgraded to Cursor Pro ($20/month). After upgrading, typed "continue" in the same Composer session and it resumed from where it left off. No code was lost — Cursor had already written the partial output to disk before hitting the limit.

**What I would do differently:**
For any project beyond a quick prototype, start with Cursor Pro. The free plan's agent token limit is exhausted quickly in a real multi-task build session. Alternatively, be more deliberate about breaking work into smaller Composer sessions to conserve tokens — rather than running one long session that covers multiple tasks, start a new session per task. This also has the benefit of giving each task a clean context window.
