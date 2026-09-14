# Audit backend operations

Current status: **M3 validated Preview integrated into main; Production activation readiness prepared; manual environment/redeploy/smoke validation PENDING**. M4 not started.

## M3 Dynamic Diagnostic Interview

### Architecture and deployment gate

Intake/review remains local. Analyze starts a diagnostic session; zero questions is valid. Each answer either yields one material BIM-specific question or signals readiness. The browser then requests the existing structured final assessment. There is no generic chat endpoint, conversation transcript, account, financial arithmetic, or M4 implementation.

**Do not deploy this M3 frontend to Production yet.** Its interview route needs shared state, the Redis interview limiter and the existing final WAF protection. `AUDIT_INTERVIEW_ENABLED` defaults to false and no deployment configuration has been changed here. M2 Production remains as previously activated. When M3 is disabled, the legacy M2 analyze request still works; when enabled, analyze accepts only a ready interview ID, preventing direct-intake bypass of interview state.

New server-only setup: configure `AUDIT_STATE_REDIS_REST_URL` (HTTPS root endpoint) and `AUDIT_STATE_REDIS_REST_TOKEN` (read/write token) for an Upstash-compatible Redis REST store supporting GET and atomic Lua EVAL/SET/EX. Use separate stores for Preview and Production, with access restricted to the backend. Existing analysis enablement, server key, model and exact-origin checks still apply. No Redis package was added. The adapter uses the documented [REST command-array format](https://upstash.com/docs/redis/features/restapi#post-command-in-body) and [EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval). The real service connection, Lua execution and expiry require Preview validation; offline transport tests do not prove provisioning.

### Endpoints and contracts

Both routes share POST-only handling, exact origin and same-origin fetch metadata checks, JSON-only/32 KiB request limits, safe error envelopes, disabled defaults and secret isolation. Both Vercel functions have a 60-second ceiling.

| Endpoint | Strict request | Result |
| --- | --- | --- |
| POST `/api/audit/interview` | `{action: "start", requestId: UUID, input: normalizedIntake}` | One question or ready state |
| POST `/api/audit/interview` | `{action: "answer", interviewId: UUID, questionId: UUID, answer: string, skipped: boolean}` | Next question or ready state |
| POST `/api/audit/analyze` with M3 enabled | `{interviewId: UUID}` | Existing `{result: auditResultSchema}` |

The browser generates one random UUID per start attempt and reuses it on retry. It is the session's unguessable bearer identifier, not trusted history; never place it in URLs or analytics. The server generates question IDs. A caller cannot supply previous questions, topics, answers, limits, model configuration, or result state. Answer text is trimmed and limited to 2,000 characters. Explicit skip requires empty answer text; non-skip requires nonempty text. Common English “don't know”, “not sure”, “unknown” and “skip” answers normalize to skipped unknowns. The localized Skip button is language-independent.

The strict Structured Output decision root is `{status, question}`. Status is `needs_clarification` or `ready_for_assessment`. `question` is null when ready; otherwise it is `{text, reason, topic}` with 10–300 character text, 1–240 character concise operational justification and a fixed topic enum. The SDK generates strict JSON Schema; independent server validation checks the status/null relationship and exactly one terminal question mark. Prompt instructions prohibit compound interrogations. Semantic question quality remains a manual gate; punctuation validation alone cannot guarantee it.

Topics: `rules_and_exceptions`, `parameters`, `connectors`, `linked_models`, `views_and_tags`, `tolerances`, `worksharing`, `mutation_authority`, `revit_version`, `deployment`, `volume`, `approval`. A previously visited topic, including skipped topics, cannot be asked again. Normalized duplicate question text is also rejected. A duplicate decision proceeds to assessment without another selection call. This conservative policy does not revisit an ambiguous answer on the same topic; unresolved details must appear in final unknowns. Cross-topic semantic paraphrases still need live quality review.

Public replies contain only `{interviewId, status, question: {id, text} | null, questionNumber}`. The operational reason is neither returned, logged, nor retained. It is not a request for chain-of-thought. Progress is a real count, “Question N of up to 4”.

### Server-owned state and retry guarantees

The Redis key holds the minimized operational workflow, structured answers (`questionId`, `topic`, `question`, `answer`, `skipped`), pending server question, decision/final call counts, absolute expiry, phase and cached final result. Contact name/email/company/role are excluded before storage or provider access. Free text is not automatically anonymized. The UI explains temporary retention and asks users to omit sensitive information.

State expires 30 minutes after creation; updates do not extend its absolute lifetime. Browser state is memory-only. Restart clears the browser question/answer/result and allocates a fresh start ID on the next explicit Analyze action, preserving original intake. Abandoned server sessions remain until expiry. Redis provider backups/retention are a separate infrastructure setting to review; TTL is application data expiry, not a claim of immediate deletion from backups.

Phases are `working`, `question`, `ready`, `complete`, `failed`. An atomic compare-and-set Lua operation reserves each call **before** invoking Astra. Concurrent requests lose the reservation and receive 409; identical completed retries reuse state/result. Conflicting answers or changed intake under the same ID are rejected. No process-memory fallback is used in production. Store outages fail closed before a new call. If a worker dies or saving fails after a reserved call, the reservation is not released for a second paid attempt: the user may need a fresh interview. Busy/failed sessions never silently retry provider calls. Session expiry or restart creates a new audit budget, still governed by WAF; this is not an authenticated per-person lifetime quota.

### Provider and cost/latency limits

`decideNextAuditQuestion(workflow, answers, model)` and `generateAuditAssessment(workflow, answers, model)` remain behind the server provider boundary. They receive an allowlisted workflow and compact structured diagnostic answers, not contact identity, internal IDs or a transcript. The existing `auditResultSchema` is unchanged. Final instructions use answers as evidence and preserve skipped/unresolved unknowns; deterministic Revit rules, read-only inspection, controlled corrections, transactions, rollback and worksharing remain explicit constraints.

| Limit | Diagnostic decision | Final assessment |
| --- | --- | --- |
| Model | `gpt-6-astra` | `gpt-6-astra` |
| Reasoning / verbosity | low / low | low / low |
| Maximum output tokens | 600 | 4,000 |
| SDK timeout | 15 seconds | 45 seconds |
| SDK retries | 0 | 0 |
| Maximum calls per session | 4 | 1 |

No tools/search/background execution or stored Responses retrieval is enabled. A single decision both evaluates sufficiency and selects the next question. After answer four, the server makes no fifth decision: it marks ready directly. Zero questions takes two model calls; the longest path takes at most five. Maximum configured output allowance is 6,400 tokens per session, not predicted usage or a price quote. Input usage grows with bounded answer history. The previously measured approximately 20-second M2 assessment is historical, not M3 latency evidence. Real decision latency, cumulative wait, truncation risk at 600 output tokens and qualitative usefulness are **PENDING** manual measurement. Do not increase caps or rewrite prompts just for style before measuring.

Safe logs include event (`audit_interview_usage` or `audit_usage`), elapsed milliseconds, model and token counts. No question, answer, identity, request object, session ID, key or provider error details are logged. Browser errors retain the localized 429 limit message even for HTML WAF responses; provider/server failures remain temporarily unavailable. Expiry/failed-session errors offer restart, busy reservations offer manual retry. No firewall details appear in user messages.

### Vercel Hobby protection (2026-09-14)

This supersedes the earlier two-WAF-rule recommendation. The owner reports one custom rate-limit rule is available. **Do not modify or remove the existing analyze WAF rule. No interview WAF rule is needed.**

| Endpoint | Protection | Fixed window | Action |
| --- | --- | --- | --- |
| POST `/api/audit/analyze` | Existing Vercel WAF `rate-limit-audit-analysis`, unchanged | 3 requests / 600 seconds / IP | 429 Too Many Requests |
| POST `/api/audit/interview` | Mandatory server-side Redis limiter | 18 requests / 600 seconds / IP | 429 Too Many Requests |

The interview limiter uses the existing `AUDIT_STATE_REDIS_REST_URL` and `AUDIT_STATE_REDIS_REST_TOKEN`. No new dependency, variable or database. Atomic Lua EVAL checks/increments the counter and sets expiry on the first accepted request. The fixed window runs 600 seconds from that request, using Redis TTL across Vercel instances. Requests 1-18 pass; request 19 is blocked. Denied requests do not increment or extend the window. Counter keys use a separate `bimcode:audit:m3:rate:interview:` namespace and SHA-256 of the canonical IP. No raw IP is logged or stored in keys; a digest is pseudonymous, not guaranteed anonymous.

**Trusted IP header: `x-vercel-forwarded-for` only**, with platform-provided `VERCEL=1`. See [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). The value must be a single valid IPv4/IPv6 address; IPv6 text is canonicalized. Missing/malformed/list/zone-qualified addresses return generic 503. No fallback to `x-forwarded-for`, `x-real-ip`, `Forwarded` or body fields. Trust requires Vercel ingress; do not expose a direct untrusted origin. A proxy in front of Vercel may share its observed IP budget across users. The local `dev:api` adapter lacks this trusted ingress and fails closed for interview calls; do not manually set VERCEL to bypass it. Offline tests inject synthetic platform context.

Limiting runs after method/enablement/origin/content-type checks, but **before body/schema processing, interview-state access or provider construction**. Invalid input and retries also consume slots once they reach the limiter. Blocked requests return safe `RATE_LIMITED`, HTTP 429 and `Retry-After` (remaining seconds, minimum 1), using the existing localized frontend UX. No interview-state read/mutation or OpenAI invocation happens when blocked. Redis configuration/network/timeout/script/malformed-response failures return generic 503 with no bypass or client-visible Redis details.

Maximum audit traffic remains five interview requests plus one final request. Three audits need 15 interview requests; three retry slots give 18. The expensive final WAF stays 3/600/IP. Shared-office IPs share a budget; fixed windows allow bursts near boundaries. Keep Preview and Production stores separate. Actual Redis Lua/expiry and Vercel header enforcement remain Preview validation gates; offline tests mock the REST contracts.

**Exact Preview next action:** deploy/redeploy this patch to Preview with the existing private Redis variables, stable `AUDIT_ALLOWED_ORIGIN`, `OPENAI_MODEL=gpt-6-astra`, and both enable flags true in Preview only. Keep Production unchanged. Retain the existing analyze WAF rule exactly; verify its existing Preview coverage without changing it. No second WAF rule or local test command is required.

**No-model limiter probe:** in a fresh 600-second window, open DevTools on the configured Preview origin and manually execute:

```js
for (let i = 1; i <= 19; i++) {
  const response = await fetch('/api/audit/interview', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  });
  console.log(i, response.status, response.headers.get('Retry-After'));
}
```

Expected: requests 1-18 return 400 (`INVALID_INPUT`), request 19 returns 429, no interview sessions or Astra calls. Previous traffic from that IP reduces the allowance. Wait 600 seconds and verify the next invalid request returns 400 again; do not delete production keys or disable protection. A Redis-blocked request still invokes the Vercel Function, but not Astra. Check provider logs accordingly. After a fresh window, explicitly run the two synthetic workflows below.

### Manual live/Preview procedure (explicit, billable, not run automatically)

1. Review the uncommitted diff. Create an isolated Preview deployment rather than pushing this frontend to Production. Privately configure a separate state store and server-only credentials. Keep Production unchanged. Test store GET/CAS/expiry with synthetic data; check concurrent reservations and fail-closed behavior.
2. Retain the existing analyze WAF rule unchanged, verify its Preview coverage, and validate the Redis interview limiter above. Record the exact stable hostname. Set `AUDIT_ALLOWED_ORIGIN` to its exact HTTPS origin, `OPENAI_MODEL=gpt-6-astra`, and both analysis/interview enable flags to `true` in Preview only. Redeploy that environment. Never put server credentials in VITE variables or reports.
3. On `/audit`, enter a synthetic ambiguous workflow: “A team manually checks Revit piping models for disconnected elements and tagging problems.” Use synthetic contact fields and ordinary operational values. Analyze explicitly. Answer using known synthetic constraints, e.g. intentional equipment endpoints, designated issue views and report-only correction authority. Use Skip once if asked about an unknown. Confirm one material question at a time, no repeated topics, no more than four questions, then a valid assessment.
4. In a second audit, use a detailed synthetic workflow: “In Revit 2025, inspect host-model mechanical piping in the named ISSUE-MEP coordination view only. Flag unconnected pipe connectors except endpoints whose approved QA_EndCondition instance parameter is Equipment or FuturePhase. Flag visible pipes missing tags in that view. Exclude linked models. Use deterministic rules and read-only reporting of element IDs. A BIM lead reviews the report; no automated edits are authorized. The model has about 5,000 pipes, uses worksharing, and the command runs interactively in pyRevit with valid Revit API context.” Confirm the model may proceed without clarification; a question is acceptable only if it materially changes the recommendation. Do not force zero with an undocumented client override.
5. Record each diagnostic turn's latency and safe input/output/cached/reasoning/total tokens, final latency/tokens, summed token usage and cumulative user wait. Note whether each question materially improved scope, deterministic rules, risk or architecture. Evaluate one-question quality, known/unknown handling, read-only-first design and no financial arithmetic/guarantees/unsupported claims. These measurements remain blank until observed, not copied from M2.
6. Verify browser → Preview Function → Astra → UI, cached retry/concurrency, restart/intake preservation, all four UI locales, mobile layout and HTML 429 handling. Confirm WAF-blocked analyze and Redis-blocked interview requests cause no normal model invocation, using firewall/function logs. Avoid unnecessary paid calls just to fill a limit; plan synthetic allowed traffic and review existing counters. Verify secrets are absent from browser assets and responses without copying values into reports.
7. Record Preview hostname, store validation, WAF evidence, model measurements and qualitative sign-off in PROJECT_STATE. Only then request a separate Production release/activation instruction. M4 remains unstarted.

The existing `npm run test:live` remains the explicit M2 provider smoke test, not an M3 interview test. Normal `npm test` uses only mocks; no real Redis or OpenAI call is made. No M3 live test has been performed by Codex.

### M3 offline validation record

45 deterministic tests PASS; production build PASS; both API routes excluded from normalized SPA rewrites; diff/new-file whitespace checks PASS; repository/generated-asset secret-pattern scan PASS. Browser assets contain no server prompt/configuration code. `.env.local` is ignored and untracked, checked through Git metadata without reading its contents. Existing missing ESLint configuration still prevents `npm run lint`; browser-data/Zod build warnings are pre-existing. No package or lockfile changes.

The built-site mocked browser run passed en/nl/de/bs across public routes and 360/768/1280/1440px widths, two-question answer/Skip/final/restart behavior, canonical payloads, submission locking, HTML429, contact fallback, social links and language persistence. Live provider/store/WAF/Preview measurements remain PENDING. No automatic paid call or deployment was performed.

### Future analytics event contract (documented, no vendor/emitter added)

| Event | Deterministic trigger | Allowed future payload |
| --- | --- | --- |
| AUDIT_STARTED | Explicit Analyze starts a fresh interview | schema version only |
| INTERVIEW_QUESTION_SHOWN | A new server question renders, once per question | question number |
| INTERVIEW_ANSWERED | Non-skip answer accepted | question number |
| INTERVIEW_SKIPPED | Skip/unknown accepted | question number |
| ASSESSMENT_GENERATED | Validated final result first renders | question count |
| ASSESSMENT_FAILED | A controlled failed request is shown | stage and controlled error category |
| INTERVIEW_RESTARTED | Explicit restart clears diagnostic state | prior question count |

Never include intake, answers, question text, contact identity, bearer/session IDs or raw error messages. Future emitters should deduplicate accepted/rendered transitions on retries. No analytics service, lead submission or social publishing is introduced.

## M2 architecture and contracts (historical baseline)

`POST /api/audit/analyze` runs as a Vercel Node.js Web Standard function (`export default { fetch }`). Shared schemas are in `shared/`; server-only code is in `server/audit/`. No Express, database, persistent sessions, or authentication service is introduced. The local Node HTTP adapter calls the same handler; Vite proxies `/api` in development only.

`auditInputSchema` accepts only the versioned M1 object: contact, workflow, and schemaVersion. It validates types without coercion, trims text, checks required identity fields, bounds strings/numbers, and enforces known enum values and custom day-interval semantics. Friendly form errors and the server schema share options/limits; final browser normalization also passes the strict schema. Unknown keys, including client model configuration, are rejected.

The model payload is an explicit allowlist: `title`, `description`, `discipline`, `software`, `revitVersion`, `painPoint`, `desiredOutcome`, `frequency: { type, occurrences, intervalDays }`, `manualEffort: { duration, unit, basis }`, and `participants`. Operational metrics inform qualitative repetition/effort/coordination judgments only. Name, email, company, role, financial fields, and derived totals are excluded. Nested fields are explicitly selected; unknown financial input keys are rejected by the intake schema. User-entered free text can still contain sensitive data; do not describe this as automatic anonymization.

`auditResultSchema` requires summary, feasibility level/subjective score/rationale, classification, opportunities, architecture, risks, unknowns, and recommended engagement. Objects are strict; strings are bounded; arrays contain at most five items; the score is an integer from 0 to 100. No arbitrary keys or financial ROI fields exist. The feasibility score is a qualitative model judgment, not calculated ROI or a probability.

## Provider configuration

Production dependencies added: `openai@7.15.0` (official Node SDK) and `zod@4.6.2` (shared validation and Structured Outputs). Versions are pinned in package.json/lockfile. Verified against installed SDK source: `responses.parse()` and `zodTextFormat()` with `text.format`, returning `output_parsed`.

The request uses `gpt-6-astra` unless `OPENAI_MODEL` overrides it server-side, `reasoning.effort: low`, `text.verbosity: low`, `max_output_tokens: 4000`, `store: false`, a 45-second SDK timeout, and no retries. No tools, streaming, background execution, or previous response state is enabled. The stable instruction prefix precedes user-specific workflow JSON. Instructions prohibit economic arithmetic, guarantees, unsupported capability claims, and treating submitted text as instructions.

Structured output is parsed by the SDK and independently checked again before returning to the browser. `store: false` disables stored Responses retrieval; it is not a claim of zero provider retention. No workflow content, identity, provider message, or stack trace is logged by application code.

## Environment

Use ignored `.env.local` locally; configure secrets directly in Vercel for each environment. Never add real values to `.env.example` or expose server configuration with `VITE_`.

- `OPENAI_API_KEY`: required server secret for calls.
- `OPENAI_MODEL`: optional, default `gpt-6-astra`.
- `AUDIT_ANALYSIS_ENABLED`: exactly `true` to allow calls; absent/false fails closed.
- `AUDIT_ALLOWED_ORIGIN`: exact site origin with scheme and optional port, no trailing slash or path. Use the deployed canonical origin; separately configure the actual preview origin for staging tests.
- `VITE_CONTACT_FORM_ENDPOINT`: existing optional public contact configuration, unchanged.

The owner has completed local live provider validation successfully; see M2.1 evidence below. Preview validation has passed; Production activation remains pending. Secret values and local environment contents are not inspected or recorded in this checkpoint.

## Mandatory pre-production protection

**Do not enable the public paid endpoint until deployment-wide rate limiting is configured and verified.** There is no distributed limiter in this repository. A per-process memory counter would not reliably protect a scaled serverless deployment, so none is presented as production protection.

Configure a Vercel Firewall rate-limit rule (or an equivalent trusted edge/distributed limiter) for POST `/api/audit/analyze`. Verify account/plan availability and configure limits appropriate to the agreed spend budget. Test an allowed request and rejection above the limit on the deployed hostname, including alias/preview access paths. Confirm the rule protects every public route to the function. Keep `AUDIT_ANALYSIS_ENABLED=false` until this is done. Also configure provider project spend limits/alerts; these do not replace endpoint rate limiting.

Current local safeguards: POST only; 32 KiB body limit enforced against both declared length and streamed bytes; JSON-only and uncompressed requests; strict input schema; exact configured Origin and Fetch Metadata checks; no CORS allowance; server-selected model and fixed output/time limits; no automatic retries; no-store responses; fail-closed configuration gate. Origin headers can be forged by non-browser clients and are not authentication or a rate limiter. Duplicate-submit UI protection is not server abuse protection.

## Errors and usage

Responses contain either `{ result }` or `{ error: { code, message } }` with controlled text. The frontend uses its own allowlisted messages and retains inputs on failure. It validates successful data before rendering React text (no raw HTML).

| HTTP | Meaning |
| --- | --- |
| 400 | Malformed JSON or invalid intake |
| 403 | Origin/Fetch Metadata rejection |
| 405 | Unsupported method; Allow: POST |
| 413 | Request exceeds 32 KiB |
| 415 | Unsupported content type/encoding |
| 422 | Provider refusal, without exposing refusal details |
| 429 | Provider rate limit, controlled Retry-After: 60 |
| 502 | Network/provider failure, incomplete response, or invalid output |
| 503 | Disabled/misconfigured endpoint, missing key, provider auth/model configuration failure |
| 504 | SDK timeout |

Application logs contain only event category, numeric provider HTTP status where available, model, input/output tokens, cached input tokens, reasoning tokens, and total tokens (unavailable values are null). These support later cost measurement; no financial totals are calculated now. Some failed parses have no available usage metadata. Never add raw provider exceptions or submitted text to these logs.

## Validation and release procedure

1. Run `npm ci`, `npm test`, `npm run build`, and `git diff --check`. The known missing ESLint configuration remains a separate maintenance issue.
2. For local integration, run `npm run dev:api` and `npm run dev` separately. The API binds only to `127.0.0.1:3001`. Set the allowed origin to the exact browser URL. Defaults return a controlled 503 without sending data to OpenAI. Do not mistake `vite preview` for a function host.
3. Explicitly run `npm run test:live` after provisioning a server key/model access. This makes one billable synthetic assessment, validates it, and prints safe usage, elapsed time, schema-pass metadata, and the synthetic assessment for manual architecture review. It does not run automatically or validate Vercel deployment/rate limiting.
4. Before an authorized deployment, verify the Vercel project, Node version, function support, environment scope, and rate-limit configuration. `vercel.json` explicitly excludes `/api` and `/api/*` from the SPA rewrite; the function has a 60-second duration budget.
5. On a protected preview deployment, verify `/api/audit/analyze` reaches the function (GET returns JSON 405 with Allow: POST, not index.html). Unknown `/api` paths must not receive SPA HTML. Verify existing page deep links still work. Local routing validation does not prove deployment settings.
6. Test enabled analysis, rejection above the deployed rate limit, safe errors, UI result quality, usage logs, and key isolation. Only after the complete activation checklist and explicit owner authorization may Production be enabled. Never put real client workflow data into smoke tests without authorization.

M3 follow-up interviewing and M4 deterministic economics remain separate milestones. A static unknowns list is not a dynamic interview. No social publishing, lead submission, or payment action occurs during analysis.

## Verified references (2026-09-12)

- [OpenAI GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra): model identifier, Responses and Structured Outputs support, low reasoning effort.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses parse helper and strict schemas.
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js): API directory and Web Standard function exports.
- [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json): rewrite syntax and filesystem precedence. The explicit API exclusion protects unknown API paths as well.


## M2.1 activation status

M2 implementation: **COMPLETE** at `253b64118ba0b96e027d4578b4addd713f25d909`.
Local live validation: **COMPLETE**. Vercel Preview validation: **COMPLETE**. Distributed rate limiting: **CONFIGURED AND VERIFIED**. Production activation: **PENDING**.

Owner-reported explicit live provider validation: **PASS** (`live_audit_schema_passed`). Model: `gpt-6-astra`; elapsed time: **19.802 s** (19,802 ms); input tokens: **786**; output tokens: **1,061**; cached input tokens: **0**; reasoning tokens: **0**; total tokens: **1,847**. Structured Output schema: **PASS**. Qualitative architecture gate: **PASS**. This records the owner's completed run and manual review; no additional billable call was made for this checkpoint.

The reported review confirms deterministic Revit API/rules first, read-only inspection before controlled corrections, AI outside the deterministic execution engine, Revit API constraints, and worksharing/transactions/rollback considerations. No financial ROI arithmetic, guaranteed savings, or unsupported capability claims were reported. The supplied evidence identifies no prompt/schema defect requiring correction. Prompt and schema remain unchanged in this checkpoint. Observe joining artifacts such as `Externalprocessing`, `systemconfiguration`, and `controlledcorrections` during Preview; no systematic defect is established and no speculative text post-processing was added. Token usage is measured; production cost-budget acceptance and deployed latency remain separate gates.


Rate-limit states are operational evidence labels, not new environment variables:

- `RATE_LIMITING_IMPLEMENTED_IN_CODE`: no; there is no application distributed limiter.
- `RATE_LIMITING_CONFIGURED_EXTERNALLY`: configured and verified on Preview, per owner evidence below.
- **Current: `RATE_LIMITING_CONFIGURED_EXTERNALLY`.** Owner verified Preview enforcement; Production activation remains pending.

## Exact WAF rule and verification

In Vercel, select the project > Firewall > Configure > + New Rule. Name it `rate-limit-audit-analysis`. Add AND conditions: Request Path equals `/api/audit/analyze`; Request Method equals `POST`. Choose Rate Limit, Fixed Window, Time Window **600 seconds**, Request Limit **3**, counting key **IP only**, and action **Default (429)**. Save Rule > Review Changes > Publish. Do not select Log as enforcement.

Current [Vercel rate-limit documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) lists fixed windows up to ten minutes on all plans. Account availability, existing rule quotas, and Preview coverage still require inspection. Counters are regional, not a global spending ceiling. Fixed-window boundaries can allow bursts.

If 600 seconds is unavailable, choose the nearest supported window **at least 600 seconds**, with at most three requests. A shorter window with three requests is weaker, not equivalent. If the account offers only shorter windows or no remaining rule capacity, leave analysis disabled until adequate external protection is provisioned; do not silently substitute an unsafe limit.

Test while analysis is disabled: send four synthetic POSTs from one IP within one window (away from its boundary); verify the fourth receives WAF 429 and does not invoke the function. Earlier requests may return disabled 503. Inspect Firewall events for this rule, timestamp, hostname, and IP. Test every exposed production/preview alias. Record actual settings, coverage, and evidence here before changing status. If WAF does not cover Preview, keep Preview protected with deployment access controls and do not expose its enabled endpoint publicly.

## Local live test and interpretation

Create ignored `.env.local` from `.env.example` and supply `OPENAI_API_KEY` privately. Keep `AUDIT_ANALYSIS_ENABLED=false`; the explicit provider smoke test intentionally bypasses HTTP enablement/origin checks. Run:

```sh
npm run test:live
```

Missing credentials exit non-zero before a call. This command makes one billable request through the production provider, defaulting to `gpt-6-astra`. It uses the six-person weekly Revit piping QA scenario, validates the actual result schema, prints safe usage/elapsed milliseconds, and prints only that synthetic assessment. It never logs contact identity or the key. Ordinary `npm test` uses injected offline transports only.

A schema pass is not a quality pass. Review the result for Revit API/rules-first inspection, connector topology, parameter checks, controlled tagging, and structured QA reporting. AI should explain or triage findings. Reject autonomous LLM model changes, ignored transaction/API constraints, guaranteed savings, invented BIMCode capabilities, or annual/financial calculations. If needed, adjust instructions minimally and repeat the explicit test. The owner-reported local quality gate has passed; repeat observation on Preview.

Capture returned model, inputTokens, cachedInputTokens, outputTokens, reasoningTokens, totalTokens, and elapsedMs. Estimate provider cost from the returned model's current published rates: uncached input = input minus cached input; price those categories separately and price output once. Reasoning tokens are included in output, so do not add them again; total tokens are not a separate billable category. Pricing is intentionally not hard-coded. Record a reviewed per-audit budget before accepting usage. Invalid/incomplete parses can lack usable metadata.

## Output and timeout review

The stable instruction prefix remains short; only the operational-context sentence changed. Existing strict string limits and five-item array limits remain. Low reasoning effort, low verbosity, and the 4,000 output-token cap balance useful architecture fields against output size; the successful local run used 1,061 output tokens; Preview measurement is still needed. Do not increase the cap automatically after truncation.

SDK timeout is **45 seconds**, retries **0**, Vercel maxDuration **60 seconds**, and browser abort **55 seconds**. The handler maps SDK timeout to controlled JSON 504; the UI retains input and displays retryable failure. Offline tests simulate timeout and provider errors; real deployment timing remains pending. Confirm the deployed runtime honors the configured 60-second limit before enablement.

## Preview-only procedure

1. Confirm the intended Vercel project and supported Node runtime. Use a protected non-production branch Preview or explicit `vercel` Preview deployment (never `--prod`). A Git checkpoint/push does not establish Preview validation or authorize Production enablement.
2. Select a stable branch Preview hostname; set `AUDIT_ALLOWED_ORIGIN` to its exact `https://hostname` without a slash. Access the audit through that hostname. Commit-specific aliases with different origins are intentionally rejected. Locally use the exact Vite origin, e.g. `http://localhost:5173`; Production uses `https://www.bimcodesolutions.com`.
3. Project Settings > Environment Variables: scope `OPENAI_API_KEY`, optional `OPENAI_MODEL=gpt-6-astra`, `AUDIT_ALLOWED_ORIGIN`, and `AUDIT_ANALYSIS_ENABLED=true` to **Preview only**, preferably the test branch. Keep Production `AUDIT_ANALYSIS_ENABLED=false` or absent. Never prefix secrets with `VITE_`.
4. Verify protection/WAF coverage before public access. Deploy/redeploy Preview after saving variables; changes apply to new deployments. See [Vercel environment scopes](https://vercel.com/docs/environment-variables).
5. Open `/audit`, enter synthetic input, review, and analyze once. Confirm schema-valid assessment rendering, preserved inputs on failure, and disabled Analyze/Edit controls during submission. Inspect Network for a single POST; response must contain only the assessment, no usage or secrets.
6. Check function logs for safe usage fields, no workflow or raw exceptions. Inspect served JS and responses locally for secret patterns without sharing keys. Verify GET API returns JSON 405, unknown API paths do not return SPA HTML, and SPA deep links load.
7. Exercise the failure matrix below, then restore the Preview settings. Record hostname, deployment ID, test time, outcomes, latency, safe usage, and WAF evidence. Do not promote this Preview or enable Production as an implicit next step.

## Preview failure matrix

Offline tests cover all handler cases below without provider traffic. On protected Preview, repeat safe boundary tests while disabled where possible; enabled provider requests incur charges.

| Check | Expected result / method |
| --- | --- |
| Disabled backend | Preview flag false, redeploy; valid POST gets 503 with no provider call |
| Malformed JSON / missing field / invalid enum / invalid number | Enabled protected Preview: submit each invalid synthetic body; JSON 400 before provider |
| Oversized request | Body over 32 KiB: 413 before provider |
| Wrong HTTP method | GET: 405 and Allow: POST |
| Wrong origin | 403; exact allowed localhost/Preview/Production origins are covered offline |
| Provider failure / timeout | Offline injected provider tests prove sanitized 502/504; browser request interception can simulate those JSON responses to inspect error UX without forcing billable timeouts |
| Invalid provider output | Offline fixture: 502, no malformed assessment rendered |
| WAF limit | Fourth POST in the configured window receives external 429; verify rule event and absence of function invocation |
| Success / duplicate submission | One synthetic analysis produces rendered assessment; second click cannot submit while pending |

External WAF may return non-JSON bodies: verify the UI still shows a safe failure and retains inputs. Do not add a public failure-simulation endpoint.

## Production activation gate

- [x] Automated offline tests pass.
- [x] Production build passes.
- [x] Local routing validation passes.
- [x] Live `gpt-6-astra` access/test passes. (Owner-reported local validation.)
- [x] Live Structured Output validates against the real schema. (Owner-reported local validation.)
- [x] Human architecture review passes. (Owner-reported local validation.)
- [ ] Measured token usage/cost is accepted.
- [x] Provider timeout/error mapping verified offline.
- [ ] Deployed timeout budget and error UX verified.
- [x] WAF configured and enforced on tested Preview (owner-reported).
- [ ] Production and other alias WAF coverage confirmed.
- [x] Vercel Preview works end-to-end (owner-reported).
- [x] Local source/generated-asset secret scan passes.
- [ ] Deployed assets/responses/logs contain no secrets.
- [ ] Production server variables prepared with enablement still false/unset.
- [ ] Explicit Production enablement authorized.

After every unchecked gate passes, an authorized operator may set Production `AUDIT_ANALYSIS_ENABLED=true` and deploy with the canonical Production origin. Verify a synthetic success, routing, logs, and WAF immediately. Roll back by setting the flag false and redeploying; environment edits alone do not change an existing deployment. M3 remains unstarted.

## Troubleshooting

Missing-key live failure: set the ignored local server key and rerun explicitly. 503: inspect flag, key presence, model access, and exact origin configuration without printing secrets. 403: compare actual browser Origin with the environment value and use the canonical Preview alias. 502: check safe error category and incomplete output; do not expose raw provider exceptions. 504: retain input, retry deliberately, and inspect latency before changing limits. 429: distinguish WAF events from provider limits; neither proves the other is configured. API HTML: inspect deployed routing/function detection. A live schema success alone does not close the activation gate.


## M2.1 Preview closure (2026-09-13)

Preview end-to-end validation: **COMPLETE**. Distributed WAF rate limiting: **CONFIGURED AND VERIFIED** (`RATE_LIMITING_CONFIGURED_EXTERNALLY`). Production activation: **PENDING**. Evidence is owner-reported; no additional live provider request was made for this checkpoint.

Browser -> Vercel Function -> `gpt-6-astra` -> assessment UI: **PASS**. Three POST `/api/audit/analyze` requests returned HTTP 200, with three successful Astra requests in function logs. The next request was rate-limited; Firewall Overview showed **Rate Limited: 1**, and it did not produce another normal Astra function invocation.

Verified active rule: `rate-limit-audit-analysis`; exact path `/api/audit/analyze`; method `POST`; strategy **Fixed Window**; limit **3 requests**; window **600 seconds**; counting key **IP Address**; action **Too Many Requests (429)**. This establishes enforcement on the tested Preview; Production/other alias coverage must be confirmed before activation.

Stable Preview origin: **exact hostname not supplied in the evidence and not recorded in repository configuration**. Do not substitute a synthetic hostname or infer an alias from the branch name. Record the tested canonical origin from the operator before Production handoff. Development branch: `preview/audit-astra`.

HTTP 429 now displays "You've reached the analysis limit. Please wait a few minutes and try again." before parsing any body, including non-JSON external responses. Other server/provider failures retain the existing temporary-unavailable message. No firewall details appear in the UI. Deterministic regression tests cover JSON/HTML/empty 429 responses and generic server errors.

Production remains disabled. M3 has not started. Before Production activation: record the exact tested origin, confirm Production origin/environment and WAF alias coverage, close the remaining cost/error/secret-isolation checklist items, and obtain explicit enablement authorization. Preview evidence alone is not authorization to enable Production.

Closure checks: 20 offline tests PASS; production build PASS (existing dependency warnings); Vercel routing normalization and API exclusions PASS; git diff --check PASS; repository/generated-asset secret-pattern scan PASS. .env.local remains ignored and untracked; its contents were not read. Checkpoint: `chore: close Astra preview validation` on `preview/audit-astra`.


## M2.2 Production activation preparation (2026-09-13)

Status: **READY FOR PRODUCTION CONFIG**, not activated. Preview checkpoint `7999d2bf6b46f4a4595e7fb7d3198dc3be25c041` was fast-forwarded into main without conflicts or history rewrite. Preview branch is retained. No secret, enablement gate, origin code, or WAF setting was changed.

Canonical origin verified by read-only HTTPS HEAD checks at 09:43 UTC: `https://bimcodesolutions.com/` returns **308**, Location `https://www.bimcodesolutions.com/`; www returns **200 HTML**. Thus the observed canonical application origin is `https://www.bimcodesolutions.com`. Recheck `/audit` redirects in the browser at activation. If both origins later independently serve the app, restore a canonical redirect or review the single-origin design before activation; never allow arbitrary origins. The static HTML response's CORS headers do not change the API's exact-origin guard.

### Manual Production configuration and smoke test

The developer performs these steps in Vercel; Codex has not configured or inspected secret values.

1. Open the intended Vercel project and confirm main is its Production branch. Check that `rate-limit-audit-analysis` covers the Production hostname before enabling paid requests.
2. Open Settings > Environment Variables. Select **Production only** for each variable below.
3. Privately add `OPENAI_API_KEY` using the authorized server key. Never copy it to source, documentation, browser code, or chat.
4. Add `OPENAI_MODEL=gpt-6-astra`.
5. At the deliberate manual activation step, add `AUDIT_ANALYSIS_ENABLED=true`. Until then leave it false/unset.
6. Add `AUDIT_ALLOWED_ORIGIN=https://www.bimcodesolutions.com`, using the verified canonical origin, no trailing slash.
7. Redeploy Production **after** the variables are configured. Confirm deployment commit/runtime and completion. A main push may deploy automatically, but a deployment made before configuration does not prove activation. Missing enablement/key/origin still fails closed with controlled 503.
8. Open `https://www.bimcodesolutions.com/audit`; check the apex redirects to the same origin.
9. Submit exactly one synthetic workflow using the data below. Confirm HTTP 200, rendered Astra assessment, and a single normal function invocation.
10. Check safe usage metadata (model, input/cached/output/reasoning/total tokens), with no workflow, key, or raw exception logged. Inspect served assets and browser network payloads for secret exposure without copying secrets into reports.
11. Verify the active Production WAF rule and its hostname scope/events: POST `/api/audit/analyze`, Fixed Window, 3 requests / 600 seconds, IP Address, Too Many Requests (429). Prefer rule/audit-log evidence after the one success; do not burn additional calls merely to reproduce Preview evidence. If an actual 429 test is needed, each allowed request incurs model cost; confirm the blocked request produces no normal Astra invocation.
12. Confirm the contact form still renders, validates, and retains its existing endpoint or email fallback. Verify delivery only with an explicitly authorized synthetic contact submission.
13. Record deployment ID/commit, time, canonical origin, HTTP/result/usage outcome, WAF evidence, client isolation, and contact outcome. Mark activation COMPLETE only after the real Production endpoint passes. On failure, set enablement false and redeploy; do not weaken the gates.

Synthetic input: name `Production Test User`; email `test@example.com`; company `BIMCode Production Test`; role `BIM Manager`; discipline `Mechanical`; title `Weekly MEP QA review`; software Revit, version `2025`; weekly, 1 occurrence; manual effort 3 hours per person per occurrence; participants 6. Description: A 6-person MEP team manually checks a Revit piping model every Friday for disconnected fittings, incorrect system classifications, missing insulation parameters, and untagged vertical pipes. Desired outcome: Automate deterministic QA checks and produce a consistent issue report. No real customer information.

### Activation evidence checklist

- [x] Local live Astra, strict schema, and architecture gate passed.
- [x] Preview end-to-end, distributed WAF enforcement, and 429 behavior passed (owner evidence).
- [x] Dedicated 429 UX and deterministic tests implemented.
- [x] No client-side secret exposure observed in validated Preview (owner checklist); local scan passed.
- [x] Canonical www origin confirmed by apex 308 and www 200.
- [ ] Exact stable Preview hostname recorded (not supplied; no alias invented).
- [ ] Production-only server variables configured by developer.
- [ ] Production deployment generated after variables exist.
- [ ] Production `/audit`, real OpenAI request, and rendered result pass.
- [ ] Production usage log safe; no secret in browser/network payload.
- [ ] Production WAF enforcement/scope verified.
- [ ] Contact form regression check passes.
- [ ] Explicit manual Production activation completed and recorded.

Production environment configuration, resulting deployment, paid smoke test, usage logs, and Production WAF are **PENDING/unverified**. No live model request or contact submission was made during preparation. M3 remains unstarted.


## M2.2 Production activation closure (2026-09-13)

Production activation: **COMPLETE**. Production smoke test: **PASS**, based on owner-reported Production evidence. This closure supersedes the earlier preparation/Preview status snapshots; no additional live API call was made by Codex.

- Canonical origin: `https://www.bimcodesolutions.com`; tested URL: `https://www.bimcodesolutions.com/audit`. Production origin validation: **PASS**.
- Environment: `production`; branch: `main`. Vercel Production function invocation succeeded.
- `POST /api/audit/analyze`: **HTTP 200**; assessment rendered successfully in the browser.
- External call confirmed: `POST https://api.openai.com/v1/responses` (OpenAI Responses API).
- Model: `gpt-6-astra`. Execution duration: approximately **20.2 seconds**.
- Usage: input tokens **774**; output tokens **1,031**; cached input tokens **0**; reasoning tokens **0**; total tokens **1,805**.
- WAF remains configured externally: `rate-limit-audit-analysis`, POST `/api/audit/analyze`, Fixed Window, **3 requests / 600 seconds / IP**, **429 Too Many Requests**. Preview enforcement was previously verified; this Production report confirms the rule remains configured, without claiming a new Production blocked-request test.
- Secret isolation: **PASS (observed)**; owner reports no client-side secret exposure. No secret values or local environment contents were inspected or recorded for this checkpoint.

M3 can be the next milestone, but has not started and requires a separate instruction. No application, prompt, schema, environment, or WAF changes were made for this documentation closure. Historical unchecked items without supplied evidence (such as a separate contact regression result or the exact Preview hostname) are not fabricated as passed.

Closure validation: all 20 offline tests PASS; production build PASS with existing dependency warnings; routing validation PASS; git diff --check PASS; repository/generated-asset secret-pattern scan PASS. .env.local is ignored and untracked, verified using Git metadata only. Closure commit message: `chore: close Astra production activation`; branch main.


## M3 Preview closure (2026-09-14)

M3 Preview validation: **COMPLETE / PASS**, based on owner-reported live evidence. This supersedes earlier pending Preview snapshots. M3 Production activation: **PENDING**, not authorized by this closure. M4 remains unstarted.

Stable Preview origin: `https://bimcode-solutions-git-preview-m3-interview-bimc-ode-solutions.vercel.app`. The same-origin text/plain probe returned415, proving the origin check passed and content-type validation was reached. Previous ORIGIN_NOT_ALLOWED is resolved; the evidence does not establish whether the original deployment mismatch was whitespace or another configuration issue. Temporary origin-value/length/equality logging is removed. Configured AUDIT_ALLOWED_ORIGIN is trimmed; exact origin equality, missing-Origin rejection and existing Sec-Fetch-Site protection remain unchanged.

**Ambiguous workflow PASS:** "A team manually checks Revit piping models for disconnected elements and tagging problems." Synthetic context: Revit2025, Mechanical, weekly, one occurrence, one hour/person, two participants, host model only, approved equipment endpoints may intentionally remain open, ISSUE-MEP tagging views, report-only/no automated edits. Interview returned200 and asked three material non-repeated questions: connector defects/intentional exceptions; tagging defect definition; host versus linked models. Answers were accepted across turns. Final analyze returned200 and rendered successfully. The four-question limit was respected; deterministic Revit API/rules-first architecture and unresolved implementation unknowns were retained.

**Detailed workflow PASS:** Revit2025 host-model piping in ISSUE-MEP; approved QA_EndCondition instance values Equipment/FuturePhase exempt intentional open endpoints; visible pipes require tags; linked models excluded; read-only element-ID report; BIM lead review/no automated edits; about5,000 pipes; worksharing; interactive pyRevit in valid API context. These supplied constraints led to **zero clarification questions** and a successfully rendered final assessment, as intended. Full test input remains in the manual procedure in docs/AUDIT_BACKEND.md.

No live latency or token measurements were supplied for these runs; none are invented. Redis-backed multi-turn state worked in the reported workflow. A separate live19th-request rejection/600-second reset result was not supplied and is not claimed. Existing protections remain: analyze Vercel WAF3/600/IP, interview Redis18/600/IP with fail-closed behavior. No secret values were inspected, copied or logged during closure.

Production steps still pending: obtain a separate release/activation authorization; verify the intended release includes this cleaned Preview commit; provision/verify an isolated Production Redis REST store; privately configure its AUDIT_STATE_REDIS_REST_URL/TOKEN and exact canonical AUDIT_ALLOWED_ORIGIN=https://www.bimcodesolutions.com; retain the existing server key/model and analyze enablement, and leave AUDIT_INTERVIEW_ENABLED disabled until the coordinated M3 release. Verify existing analyze WAF3/600/IP remains unchanged and the Redis limiter's deployed rejection/reset behavior. Then, only under Production authorization, merge/release to main, enable the interview in Production and redeploy together; perform a no-model origin/limiter probe and explicitly authorized synthetic smoke test, record safe usage/quality and confirm secret isolation. Until then do not deploy the M3 frontend to Production, change its environment, or alter the existing Production one-shot analyze behavior.

Closure checks: all 59 offline tests PASS; production build PASS (existing browser-data/Zod warnings); routing validation PASS; git diff --check PASS; secret-pattern scan PASS. .env.local remains ignored/untracked, verified without reading values. Runtime review found no temporary origin diagnostics, hard-coded Preview hostname, credentials or test fixtures. Exact closure files: server/audit/handler.js, server/audit/origin.test.js, PROJECT_STATE.md and docs/AUDIT_BACKEND.md. Closure is committed/pushed only to preview/m3-interview; no main merge or Production activation is performed.


## M3 Production activation readiness (2026-09-14)

Repository integration: validated Preview commit `fddf5c9b13b64362d89e500a826af07c0d242b8f` fast-forwarded into main from `2725693`. No history rewrite, conflict, business/UI change or M4 work. The owner has authorized this integration and main push. This supersedes the earlier Preview-only release restriction. **Production environment configuration, redeployment and live smoke validation remain PENDING.** A Git-triggered deployment is not evidence of activation; the M3 UI needs its configured backend and can be unavailable until manual setup/redeployment completes. No Vercel environment or WAF settings were changed by Codex.

Use a **separate Production Upstash-compatible Redis REST database**, not the Preview database. This isolates transient workflow data and per-IP counters (both environments use the same key namespace). No new dependency is needed. Privately create or verify these variables with scope **Production only**:

| Variable | Required Production value |
| --- | --- |
| AUDIT_STATE_REDIS_REST_URL | Separate Production database HTTPS REST root URL |
| AUDIT_STATE_REDIS_REST_TOKEN | Its read/write REST token, not a read-only token |
| AUDIT_ALLOWED_ORIGIN | https://www.bimcodesolutions.com |
| OPENAI_API_KEY | Authorized server-side OpenAI project key |
| OPENAI_MODEL | gpt-6-astra |
| AUDIT_ANALYSIS_ENABLED | true |
| AUDIT_INTERVIEW_ENABLED | true |

Do not prefix server variables with VITE_. Integration-injected Redis variables are not automatically read: map credentials privately to the exact AUDIT_STATE_REDIS_REST_* names. Do not copy Preview origin settings. VERCEL=1 is platform-provided, not a manual bypass setting. Never report secret values. Keep Preview settings separate.

Manual redeploy sequence: open the linked Vercel project; Settings -> Environment Variables; create/update all seven Production-scoped variables and save. Verify the existing analyze WAF remains exact POST /api/audit/analyze, Fixed Window, 3 requests/600 seconds/IP, action429. Do not modify/remove it or add a second rule. In Deployments select the main deployment containing the final readiness commit, choose Redeploy, verify the target is Production, and redeploy after variables are saved. Wait for Ready, confirm the deployed Git SHA and the canonical www domain, then use https://www.bimcodesolutions.com/audit. Do not select the Preview deployment by mistake. No local command is necessary after main is pushed. Redis interview protection remains mandatory18/600/IP across instances; origin trimming/exact comparison, missing-Origin and fetch-metadata checks, secret isolation and30-minute state remain intact.

Production verification, after configuration:

1. From the canonical site's DevTools, POST /api/audit/interview with Content-Type:text/plain and any nonsensitive text. Expect415: origin passed without any Redis/OpenAI call.
2. In a fresh600-second IP window, POST JSON {} to /api/audit/interview nineteen times from that site. Expect400 INVALID_INPUT for1-18,429 RATE_LIMITED for19 and a Retry-After header. No interview state or model call is created; a Vercel Function invocation itself is expected. Wait600 seconds and verify another invalid request returns400. Use a new window before the workflow test. Do not delete keys or disable limits to reset this probe.
3. **Paid smoke test requires explicit authorization after Production configuration.** Then submit one synthetic intake: title Piping QA; description "A team manually checks Revit piping models for disconnected elements and tagging problems." Mechanical, Revit2025, weekly, one occurrence, one hour/person, two participants; synthetic contact fields only. Review -> Analyze. Expect focused questions (Preview asked three, but exact wording/count is not guaranteed); answer with intentional approved equipment endpoints, ISSUE-MEP tagging views, host model only, report-only/no edits. Verify no duplicates, at most four questions, accepted answers, final POST /api/audit/analyze200 and rendered structured assessment. Preserve deterministic API/rules-first architecture and unresolved unknowns.
4. Inspect browser requests/responses and built assets for absence of server credentials; do not copy values into reports. Review safe usage logs for model, token counts and timing. Confirm Production Redis holds expiring session state and isolated rate counters; keep workflow content out of diagnostic reports.
5. Confirm the existing analyze WAF's Production scope and3/600/IP configuration in Firewall. If enforcement verification is needed, in a fresh WAF window send four JSON {} requests to analyze: allowed requests fail input validation400 without model calls, the fourth should be429 at WAF. Confirm firewall counters and absence of a normal function/model invocation for the WAF-blocked request. Do not perform this probe before a smoke test without waiting for reset, since it uses the same WAF allowance.
6. Record the deployed commit, Production environment, origin probe, Redis rejection/reset, WAF evidence, final200, model usage/latency, quality and secret-isolation result. Mark M3 Production COMPLETE only after actual validation. M4 remains unstarted.

Validation on integrated main: all 59 offline tests PASS; production build PASS with existing browser-data/Zod warnings; routing normalization/API exclusion PASS; git diff --check PASS; secret-pattern scan PASS. .env.local is ignored/untracked; contents were not inspected. Runtime scan found no Preview-only hostname, temporary origin diagnostics or test fixture imports. The readiness commit changes only these two operations documents; merged code is exactly the validated Preview implementation. No paid or other live Production calls were performed by Codex. Remaining blockers are manual Production Redis/variable setup, redeployment, actual limiter/WAF verification and separately authorized paid smoke validation.


## Shared Redis environment isolation (2026-09-14)

Owner will temporarily share the Upstash database due to the free-tier database limit. Code change required: prior keys had no environment/host namespace. All store keys now use validated server-side VERCEL_ENV (production, preview, development); missing/invalid environment on Vercel fails closed. Non-Vercel local storage defaults to development. No request Host is trusted and no new variable or dependency is introduced; VERCEL_ENV is platform-provided.

Before: session and completed assessment/cache `bimcode:audit:m3:<sessionId>`; limiter `bimcode:audit:m3:rate:interview:<sha256(canonicalIP)>`.
After: session and completed assessment/cache `bimcode:audit:m3:<environment>:<sessionId>`; limiter `bimcode:audit:m3:<environment>:rate:interview:<sha256(canonicalIP)>`.

Completed results live inside the session record; there is no separate unnamespaced cache. Preview and Production now isolate identical session IDs and IP counters. Session TTL remains1800 seconds, fixed limiter window600 seconds/18 requests; Lua atomicity and external API behavior unchanged. No fallback reads/writes of old keys. On rollout active old interviews need restart; old sessions expire within30 minutes, old counters within10 minutes, and new namespaced limiter allowances start fresh. Deploy this patch to both environments before relying on shared-database isolation. All Preview deployments in this project still share the preview namespace. This prevents key collisions, not credential-level access isolation or shared capacity exhaustion.

Validation:61 offline tests PASS, including shared-transport identical-session/cached-result isolation, independent Preview/Production IP allowances, and fail-closed missing environment. No environment values changed, deployment performed, live calls, commit or push. Production activation still pending. This temporary shared-database arrangement supersedes the separate-database prerequisite for activation; a separate database remains preferable when available.


## Shared Redis Preview release (2026-09-14)

The four-file isolation patch was transferred unchanged from main's working tree to preview/m3-interview. Preview was fast-forwarded to the existing main documentation commit50bd329 first; main itself remains unchanged. Implementation/test contents were compared against the transfer snapshot and match exactly. No deployment settings, Redis credentials or environment variables changed. No paid calls.

Release checks:61 offline tests PASS; extra mocked development namespace checks PASS (implicit local development and explicit development); production build PASS (existing warnings); routing validation PASS; git diff --check PASS; secret-pattern scan PASS. .env.local remains ignored/untracked. Confirmed preview/production key isolation, deployed missing/invalid VERCEL_ENV fails closed,1800-second session TTL,18/600/IP limiter and unchanged atomic Lua operations.

Preview verification after the branch push: wait for the Preview deployment of this release commit to become Ready and confirm its SHA and Preview environment (not Production). Do not edit Vercel variables. On the stable Preview origin, send a same-origin text/plain interview probe and expect415. In a fresh600-second window, send nineteen JSON{} interview requests: expect400 for1-18 and429 for19, with no model calls. Inspect only the matching counter key/TTL in Upstash: `bimcode:audit:m3:preview:rate:interview:<IP-hash>`, TTL at most600; confirm these requests do not create/update production-prefixed counters. Verify reset after expiry. Session/cache isolation is already offline-tested with identical IDs; at the next separately authorized live Preview interview, verify its key is `bimcode:audit:m3:preview:<sessionId>`, TTL at most1800, and completed result remains in that same key. Do not run a paid workflow merely for this release. Old sessions need restart and old unnamespaced keys expire naturally. Do not claim Production deployment isolation until this patch is separately released there; main merge remains pending.
