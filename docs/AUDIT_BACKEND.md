# Audit backend operations

## Architecture and contracts

`POST /api/audit/analyze` runs as a Vercel Node.js Web Standard function (`export default { fetch }`). Shared schemas are in `shared/`; server-only code is in `server/audit/`. No Express, database, persistent sessions, or authentication service is introduced. The local Node HTTP adapter calls the same handler; Vite proxies `/api` in development only.

`auditInputSchema` accepts only the versioned M1 object: contact, workflow, and schemaVersion. It validates types without coercion, trims text, checks required identity fields, bounds strings/numbers, and enforces known enum values and custom day-interval semantics. Friendly form errors and the server schema share options/limits; final browser normalization also passes the strict schema. Unknown keys, including client model configuration, are rejected.

The model payload is an explicit allowlist: title, description, discipline, software, Revit version, pain point, desired outcome, and frequency type. It excludes name, email, company, role, duration, participant/occurrence counts, and other arithmetic inputs. User-entered free text can still contain sensitive data; do not describe this as automatic anonymization.

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

No API key was available during implementation. No live OpenAI call was made. Documentation verifies the model/API interface, but account access and live quality/latency must still be tested.

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

Application logs contain only event category, numeric provider HTTP status where available, model, input/output tokens, and cached input tokens. These support later cost measurement; no financial totals are calculated now. Some failed parses have no available usage metadata. Never add raw provider exceptions or submitted text to these logs.

## Validation and release procedure

1. Run `npm ci`, `npm test`, `npm run build`, and `git diff --check`. The known missing ESLint configuration remains a separate maintenance issue.
2. For local integration, run `npm run dev:api` and `npm run dev` separately. The API binds only to `127.0.0.1:3001`. Set the allowed origin to the exact browser URL. Defaults return a controlled 503 without sending data to OpenAI. Do not mistake `vite preview` for a function host.
3. Explicitly run `npm run test:live` after provisioning a server key/model access. This makes one billable synthetic assessment, validates it, and prints only safe usage/pass metadata. It does not run automatically or validate Vercel deployment/rate limiting.
4. Before an authorized deployment, verify the Vercel project, Node version, function support, environment scope, and rate-limit configuration. `vercel.json` explicitly excludes `/api` and `/api/*` from the SPA rewrite; the function has a 60-second duration budget.
5. On a protected preview deployment, verify `/api/audit/analyze` reaches the function (GET returns JSON 405 with Allow: POST, not index.html). Unknown `/api` paths must not receive SPA HTML. Verify existing page deep links still work. Local routing validation does not prove deployment settings.
6. Test enabled analysis, rejection above the deployed rate limit, safe errors, UI result quality, usage logs, and key isolation. Only then enable production. Never put real client workflow data into smoke tests without authorization.

M3 follow-up interviewing and M4 deterministic economics remain separate milestones. A static unknowns list is not a dynamic interview. No social publishing, lead submission, or payment action occurs during analysis.

## Verified references (2026-09-12)

- [OpenAI GPT-6 Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra): model identifier, Responses and Structured Outputs support, low reasoning effort.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses parse helper and strict schemas.
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js): API directory and Web Standard function exports.
- [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json): rewrite syntax and filesystem precedence. The explicit API exclusion protects unknown API paths as well.
