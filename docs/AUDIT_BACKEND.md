# Audit backend operations

## Architecture and contracts

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
M2 production activation: **PENDING**. M2.1 is ready for the manual live test; no key is available locally and no live response, token count, latency, model access, Preview deployment, or WAF configuration has been verified. Production was not enabled.

Rate-limit states are operational evidence labels, not new environment variables:

- `RATE_LIMITING_IMPLEMENTED_IN_CODE`: no; there is no application distributed limiter.
- `RATE_LIMITING_CONFIGURED_EXTERNALLY`: unverified; use only after publishing and testing the external rule.
- **Current: `RATE_LIMITING_NOT_YET_CONFIGURED`.** Public activation remains blocked.

## Exact WAF rule and verification

In Vercel, select the project > Firewall > Configure > + New Rule. Name it `audit-analyze-ip-limit`. Add AND conditions: Request Path equals `/api/audit/analyze`; Request Method equals `POST`. Choose Rate Limit, Fixed Window, Time Window **600 seconds**, Request Limit **3**, counting key **IP only**, and action **Default (429)**. Save Rule > Review Changes > Publish. Do not select Log as enforcement.

Current [Vercel rate-limit documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) lists fixed windows up to ten minutes on all plans. Account availability, existing rule quotas, and Preview coverage still require inspection. Counters are regional, not a global spending ceiling. Fixed-window boundaries can allow bursts.

If 600 seconds is unavailable, choose the nearest supported window **at least 600 seconds**, with at most three requests. A shorter window with three requests is weaker, not equivalent. If the account offers only shorter windows or no remaining rule capacity, leave analysis disabled until adequate external protection is provisioned; do not silently substitute an unsafe limit.

Test while analysis is disabled: send four synthetic POSTs from one IP within one window (away from its boundary); verify the fourth receives WAF 429 and does not invoke the function. Earlier requests may return disabled 503. Inspect Firewall events for this rule, timestamp, hostname, and IP. Test every exposed production/preview alias. Record actual settings, coverage, and evidence here before changing status. If WAF does not cover Preview, keep Preview protected with deployment access controls and do not expose its enabled endpoint publicly.

## Local live test and interpretation

Create ignored `.env.local` from `.env.example` and supply `OPENAI_API_KEY` privately. Keep `AUDIT_ANALYSIS_ENABLED=false`; the explicit provider smoke test intentionally bypasses HTTP enablement/origin checks. Run:

```sh
npm run test:live
```

Missing credentials exit non-zero before a call. This command makes one billable request through the production provider, defaulting to `gpt-6-astra`. It uses the six-person weekly Revit piping QA scenario, validates the actual result schema, prints safe usage/elapsed milliseconds, and prints only that synthetic assessment. It never logs contact identity or the key. Ordinary `npm test` uses injected offline transports only.

A schema pass is not a quality pass. Review the result for Revit API/rules-first inspection, connector topology, parameter checks, controlled tagging, and structured QA reporting. AI should explain or triage findings. Reject autonomous LLM model changes, ignored transaction/API constraints, guaranteed savings, invented BIMCode capabilities, or annual/financial calculations. If needed, adjust instructions minimally and repeat the explicit test. No live quality claim is currently made.

Capture returned model, inputTokens, cachedInputTokens, outputTokens, reasoningTokens, totalTokens, and elapsedMs. Estimate provider cost from the returned model's current published rates: uncached input = input minus cached input; price those categories separately and price output once. Reasoning tokens are included in output, so do not add them again; total tokens are not a separate billable category. Pricing is intentionally not hard-coded. Record a reviewed per-audit budget before accepting usage. Invalid/incomplete parses can lack usable metadata.

## Output and timeout review

The stable instruction prefix remains short; only the operational-context sentence changed. Existing strict string limits and five-item array limits remain. Low reasoning effort, low verbosity, and the 4,000 output-token cap balance useful architecture fields against output size; live measurement is still needed. Do not increase the cap automatically after truncation.

SDK timeout is **45 seconds**, retries **0**, Vercel maxDuration **60 seconds**, and browser abort **55 seconds**. The handler maps SDK timeout to controlled JSON 504; the UI retains input and displays retryable failure. Offline tests simulate timeout and provider errors; real deployment timing remains pending. Confirm the deployed runtime honors the configured 60-second limit before enablement.

## Preview-only procedure

1. Confirm the intended Vercel project and supported Node runtime. Use a protected non-production branch Preview or explicit `vercel` Preview deployment (never `--prod`). This task does not deploy or push.
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
- [ ] Live `gpt-6-astra` access/test passes.
- [ ] Live Structured Output validates against the real schema.
- [ ] Human architecture review passes.
- [ ] Measured token usage/cost is accepted.
- [x] Provider timeout/error mapping verified offline.
- [ ] Deployed timeout budget and error UX verified.
- [ ] WAF actually configured, enforced, and alias coverage verified.
- [ ] Protected Vercel Preview works end-to-end.
- [x] Local source/generated-asset secret scan passes.
- [ ] Deployed assets/responses/logs contain no secrets.
- [ ] Production server variables prepared with enablement still false/unset.
- [ ] Explicit Production enablement authorized.

After every unchecked gate passes, an authorized operator may set Production `AUDIT_ANALYSIS_ENABLED=true` and deploy with the canonical Production origin. Verify a synthetic success, routing, logs, and WAF immediately. Roll back by setting the flag false and redeploying; environment edits alone do not change an existing deployment. M3 remains unstarted.

## Troubleshooting

Missing-key live failure: set the ignored local server key and rerun explicitly. 503: inspect flag, key presence, model access, and exact origin configuration without printing secrets. 403: compare actual browser Origin with the environment value and use the canonical Preview alias. 502: check safe error category and incomplete output; do not expose raw provider exceptions. 504: retain input, retry deliberately, and inspect latency before changing limits. 429: distinguish WAF events from provider limits; neither proves the other is configured. API HTML: inspect deployed routing/function detection. A live schema success alone does not close the activation gate.
