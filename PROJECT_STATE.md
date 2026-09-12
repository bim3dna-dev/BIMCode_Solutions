# BIMCode Solutions — Project State

## Metadata

- Last updated: 2026-09-12 (Europe/Sarajevo).
- Current branch: `main`.
- Latest relevant commit / M0 checkpoint: `4f279634a871ba2cab7dcc282be750e45e645774` — docs: establish project baseline and handoff state. Successfully pushed to `origin/main` on 2026-09-12.
- Current milestone: M1 — AI Audit Product Surface. Complete locally and validated; ready for browser review, intentionally uncommitted and unpushed.
- Next milestone: M2 — secure server-side OpenAI/Astra integration with schema-validated structured output. Not started; requires its own task.
- This file is the canonical handoff; do not rely on chat history.

## Production State

The owner reports the website live at https://www.bimcodesolutions.com. The repository contains a static React/Vite website and Vercel SPA rewrite configuration. The deployed commit, live hosting account/settings, automatic deployment trigger, and production contact endpoint have not been independently verified. No production deployment or contact submission was performed during M0.

The production baseline's BIM Automation Audit is a consultancy inquiry offering. Local M1 adds `/audit` with workflow intake and a local input summary; it has not been pushed or deployed. No server/API layer, model integration, generated analysis, report purchase, payment provider, or conversion analytics implementation exists. The authorized M0 documentation push succeeded; whether that push triggered hosting automation remains unverified. No deployment command or external form submission was performed.

## Current Business Objective

Build **BIMCode AI Automation Audit** around this commercial funnel:

Visitor → describes repetitive BIM/Revit workflow → AI performs structured diagnostic questioning → automation feasibility analysis → ROI/cost analysis → technical implementation recommendation → free preview / paid full audit → Automation Sprint / Retainer conversion.

Reach paid validation quickly with a narrow V1.

## Completed Existing Website Work

Verified from source, rather than claims of live delivery:

- React Router pages for home, solutions, case study, blog list and slug-based detail; `/products` redirect and not-found page. Unknown blog slugs return to `/blog`.
- Shared responsive layout/navigation and footer; light/dark theme with system preference and localStorage persistence.
- Homepage hero, demo placeholder, benefits, process, offers, outcomes, founder/about, and contact sections.
- Static consultancy offers, solution descriptions, and three blog articles in `src/data/content.js`.
- Case-study presentation covering a Revit production toolkit, tagging, exports, QA, scope extraction, drawing scanner prototype, and toolbar deployment. This is website content, not the implementation of those tools in this repository.
- Contact intent preselection, browser field validation, JSON endpoint submission/status handling, and email-app fallback. No Formspree-specific integration was found.
- Vite React build, Tailwind brand styling, and Vercel SPA rewrite.

The workflow demo is explicitly a coming-soon placeholder. Legacy `LogosSection.jsx` and `CustomizationSection.jsx` are not mounted by `HomePage.jsx`.

## Product Roadmap

### M0 — Repository Baseline and Cross-Machine Handoff

Complete. Documentation/environment baseline committed separately as `4f279634a871ba2cab7dcc282be750e45e645774` and pushed to the configured GitHub remote (`origin/main`). Build and diff checks passed before committing. Only README, PROJECT_STATE, .env.example, and .gitignore were included; no secrets were found.

### M1 — AI Audit Product Surface

Complete locally, validated, ready for browser review. `/audit` includes the product hero, staged three-step explanation, validated workflow intake, local structured preview, edit action, and manual-review link to the existing contact form. A single Audit entry is available in desktop/mobile navigation. No external service, database, authentication, payment, or social integration was introduced. See M1 validation and Git handoff below.

### M2 — AI Audit Engine

Not started. Introduce secure server-side integration with the selected OpenAI model, structured outputs, and schema validation. The developer refers to an available model as GPT-6 Astra; this is not a verified production API identifier. Verify the exact API model identifier and supported interface before integration. Credentials must never reach browser code. No model identifier is selected during M0.

### M3 — Dynamic Diagnostic Interview

Not started. Ask only questions needed to resolve ambiguity in workflow analysis. Account for BIM/AEC and Revit workflow constraints.

### M4 — Automation Report and ROI Engine

Not started. Produce workflow summary, automation feasibility and score, current manual effort, estimated annual effort, potential savings, assumptions, technical architecture, deterministic versus AI responsibilities, estimated implementation complexity, and recommended BIMCode engagement. Calculate arithmetic and ROI deterministically in application code whenever possible.

### M5 — Commercial Conversion

Not started. Implement free preview, paid full report, payment flow, Automation Sprint CTA, Retainer CTA, lead capture, and conversion analytics. Payment provider is undecided; do not invent one during M0.

Payment implementation belongs to M5. Verify provider availability for a Bosnia and Herzegovina registered business before selecting a provider. BIMCode application code must never directly store customer payment credentials; raw card data must not pass through BIMCode application servers. No payment SDK is present in M1.

### M6 — Knowledge-Grounded Recommendations

Not started. Ground recommendations in verified BIMCode capabilities and case studies. Candidate areas: Revit QA, connector inspection, MEP automation, tagging, print automation, AI-assisted model workflows, image/symbol recognition, and Revit family generation.

Current source supports website descriptions of QA, tagging, sheet/print/export automation, MEP workflows, pyRevit tooling, and experimental drawing recognition (`src/data/content.js`, `src/pages/CaseStudyPage.jsx`). These descriptions do not establish quantified customer results. Connector inspection and family generation need supporting evidence before capability claims. Keep experimental capabilities labeled as such.

### M7 — Distribution Engine

Not started. Generate marketing drafts for meaningful events: `PRODUCT_LAUNCHED`, `MAJOR_FEATURE_SHIPPED`, `CASE_STUDY_PUBLISHED`, `CUSTOMER_RESULT`, `NEW_AUTOMATION_CAPABILITY`, `IMPORTANT_PRODUCT_LEARNING`.

Initial flow: event → draft generated → human approval → publication. Never automatically publish arbitrary Git commits. Keep LinkedIn integration behind an abstraction independent of any specific social API implementation.

Owner-provided future publishing destinations (metadata only, no integration or publication performed):

- LinkedIn: https://www.linkedin.com/in/emin-avdovic-90210/
- Instagram: https://www.instagram.com/bimcode_solutions_/

Generate platform-specific drafts for meaningful product events, then require human approval before publication.

### M8 — Analytics and Optimization

Not started. Track audit starts/completions, preview-to-payment conversion, report purchases, Sprint CTA conversions, Retainer leads, workflow categories, and common automation opportunities. Use real data to choose repeated workflows for standalone BIMCode products.

## Architectural Constraints and Decisions

### Product scope

Keep V1 narrow. Do not add user accounts, organizations, dashboards, subscription management, complex databases, generic AI chat, or a Revit add-in without clear justification. The target is a paid validation point.

### AI boundary

The model may classify workflows, ask diagnostic questions, identify automation opportunities, explain implementation options, and assist recommendations. Application code owns arithmetic, ROI formulas, input/schema validation, permissions, payments, pricing rules, and persistent state where needed. Future server hosting and persistence choices remain undecided.

### Security

No secrets in client bundles or Git. Validate server inputs and model outputs. Rate-limit public AI endpoints before production. Avoid sending unnecessary customer-sensitive BIM information to model APIs. The current optional `VITE_CONTACT_FORM_ENDPOINT` is public build-time configuration; it cannot hold a secret. `.env.example` is blank and `.env` variants are ignored, except the example.

### Commercial and BIM/Revit accuracy

Expose assumptions for AI-generated estimates. Savings and implementation costs are estimates, never guaranteed outcomes. Distinguish Revit API automation, pyRevit tooling, Python/offline processing, deterministic rules engines, computer vision, LLM reasoning, and workflows that cannot safely or reliably be automated. Prefer deterministic Revit API logic where safer; do not imply an LLM should directly manipulate Revit.

### M0 decisions

Preserve source, dependency versions, routes, styling, and deployment configuration. Document existing tooling defects rather than introducing a lint framework or refactor during M0. Retain the existing tracked `dist/` policy; any policy change requires separate scoped work. README contains durable setup information; this file contains milestone status and validation history. No `AGENTS.md` was found; `.agents/` contains no instruction files, and `docs/AI_TASKS.md` is empty.

## Cross-Machine Workflow

Before every new Codex session:

1. Read `AGENTS.md` if present.
2. Read `README.md`.
3. Read `PROJECT_STATE.md`.
4. Run `git status` and check the branch.
5. Inspect recent commits (`git log -5 --oneline`).
6. Verify the current milestone and exact next action.
7. Install from the lockfile on a fresh machine and run relevant validation before changing code.

At the end of every milestone:

1. Update `PROJECT_STATE.md`.
2. Mark milestone status.
3. Record meaningful architectural decisions.
4. Record tests, lint, and build results.
5. Record known defects or blockers.
6. Record the exact next action.
7. Record Git status and relevant commits.

The repository is the source of truth. Commit and push the reviewed handoff before switching machines; on the other machine, inspect local changes before pulling. Documentation left only in an uncommitted working tree is not transferable through Git. Use `git log` to identify the eventual M0 commit; do not invent a future commit hash here.

## M0 Validation History

Validation environment: Windows PowerShell, Node `v24.13.0`, npm `11.6.2`. Initial working tree was clean on `main` at `f58c1ec`.

| Check | Result |
| --- | --- |
| Installation | `npm ci --no-audit --no-fund --cache "$env:TEMP\bimcode-m0-npm-cache"` passed: 366 packages installed. Restricted attempts failed (npm exit-handler/cache error, then registry EACCES); the network-enabled retry succeeded. |
| Lint | `npm run lint` failed: ESLint 8.57.1 cannot find a configuration file. Pre-existing repository gap, unchanged by M0. |
| Production build | `npm run build` passed with Vite 7.1.9, 1,519 modules transformed. Warnings about old baseline-browser-mapping and Browserslist data; no dependency changes made. |
| Tests | Not run: no test script, suite, or runner exists. |
| Diff review | `git diff --check` passed. Reviewed tracked diff and new files; no source, lockfile, package, deployment configuration, or generated artifact changes remain. |
| Environment safety | `.env.example` contains only comments and an empty public variable. Ignore checks confirm `.env`, `.env.local`, and `.env.production` are ignored; the example is not. No secrets introduced in the four changed/new files. |

Early lint/build attempts while installation was incomplete failed because executables were unavailable; those are superseded by the completed-install results above. Dev/preview servers and live contact delivery were not exercised.

Final local Git state: modified `.gitignore` and `README.md`; untracked `.env.example` and `PROJECT_STATE.md`. Branch remains `main`, HEAD remains `f58c1ec6151fc99ef2b14c21bfccec9bb49f3fa0`. No changes staged, committed, pushed, or deployed. The production build reproduced the tracked output without a Git content diff. M0 is complete as documentation/baseline work despite the explicitly recorded pre-existing lint/test gaps; M1 is not started.

## Known Issues and Limits

- No ESLint configuration despite a lint script. No npm test script or broad regression suite; M1 adds narrowly scoped tests using Node's built-in runner.
- `src/sections/LogosSection.jsx` imports `partnerLogos`, which is not exported by `src/data/content.js`. It is unused by the current page graph; mounting it would require a fix.
- Generated `dist/` is tracked. Builds can dirty the working tree; review artifacts separately from source changes.
- Dependency installation reports deprecated packages, including ESLint 8. No dependency upgrade is included; installation with `--no-audit` is not a security audit.
- Production deployment settings, contact provider/delivery, and deployed revision remain unverified. Browser interaction and live production behavior are not covered by a build.

## M1 Architecture and Validation

Added files:

- `src/pages/AuditPage.jsx`: landing page, grouped accessible form, local summary, edit and manual-review CTA.
- `src/features/audit/workflow.js`: options, length limits, validation, normalized JSDoc model, frequency display helper.
- `src/features/audit/workflow.test.js`: four Node test cases covering normalization, required/invalid inputs, numeric bounds, and custom frequency semantics.

Modified source/docs: `src/App.jsx` (adds `/audit`), `src/components/Header.jsx` (one Audit navigation entry; wrapped navigation below the large breakpoint to fit tablet widths), `README.md`, and `PROJECT_STATE.md`. Existing forms, pages, global styles, dependency manifests/lockfile, and Vercel configuration are unchanged.

The existing tracked-output policy is retained. Build output updates `dist/index.html`, replaces `dist/assets/index-CCf3uH34.css` and `dist/assets/index-bQnARIPK.js` with the current generated CSS/JS. These are generated M1 changes, not hand-edited artifacts.

Decisions:

- React component state owns the draft and normalized preview; no localStorage, network submission, analytics, or persistence for intake data. Refresh/navigation clears it. Editing preserves the draft during the current page visit.
- Versioned object: `schemaVersion: 1`, `contact` (name/email/company/role), `workflow` (title/description/discipline/software/Revit version/frequency/manual effort/participants/pain point/desired outcome). Strings are trimmed; empty Revit version becomes null; software is allowlisted and deduplicated; numeric strings become numbers. No unrecognized fields are copied.
- Frequency uses daily/weekly/monthly/per project/custom plus positive integer occurrences. Custom requires an explicit interval in days; other types normalize intervalDays to null. No automatic annualization assumptions.
- Manual effort is a positive finite duration in hours/minutes, explicitly per person per occurrence. Participants are positive integers. Counts are capped at 10,000, custom intervals at 3,650 days, duration at 1,000 hours or 60,000 minutes; text fields have explicit limits.
- Field errors are associated with inputs, the first invalid field receives focus, and preview/edit transitions move focus to the relevant heading. Required work email uses basic format validation, not an invented company-domain restriction.
- Preview copy states that no AI analysis was generated or data sent. Manual review opens `/?inquiry=audit#contact` and explains that details are not transferred. Contact implementation stays unchanged.
- No new runtime dependencies. Temporary Playwright tooling used the installed Edge browser outside the repository; model tests use built-in Node tooling. Client validation is not a future server security boundary.

Validation on 2026-09-12:

| Check | Result |
| --- | --- |
| Baseline build before M0 commit | Passed, 1,519 modules; M0-only diff verified. |
| M1 production build | Passed, 1,521 modules; existing browser-data warnings remain. |
| Model tests | `node --test src/features/audit/workflow.test.js`: 4 passed, 0 failed. |
| Lint | `npm run lint`: same pre-existing missing ESLint configuration failure. |
| Routes in real browser | Local production preview: `/`, `/products` → `/solutions`, `/case-study`, `/blog`, `/#contact`, `/audit` passed. `/contact` retains its existing not-found behavior. |
| Intake and summary | Required fields, invalid email, zero duration, fractional participants, missing custom period rejected. Valid custom frequency, software selection, preview, keyboard focus, and edit retention passed. |
| Responsive / theme | Edge checks at 360, 390, 768, 1024, and 1440px passed with no horizontal overflow and visible Audit navigation. Screenshots captured; mobile page visually inspected. Dark mode passed. |
| Contact / privacy | Manual-review CTA opens existing contact with audit selected. Return to Audit clears inputs. Zero POST requests and zero uncaught page errors in the browser checks. No external submission performed. |
| Direct routing | Direct local `/audit` navigation passed; unchanged Vercel catch-all SPA rewrite covers `/audit`. Live Vercel deployment was not tested. |
| Scope / secrets | Final diff reviewed, `git diff --check` passed; no credentials or new environment variables added. |

No M1 blocker found. Live production/contact delivery remains outside this validation. Local browser-check scripts/screenshots are temporary verification artifacts, not required runtime dependencies or canonical handoff files.

## Current Git Handoff and Exact Next Action

Branch: `main`. HEAD/M0 commit: `4f279634a871ba2cab7dcc282be750e45e645774`, pushed to `origin/main`. M1 has no commit: source/docs and regenerated `dist/` changes are unstaged; the new Audit page/model/tests and hashed build assets are untracked. M0 and M1 remain separate. No M1 push or deployment was performed.

Next action: browser-review `/audit` using `npm run preview` after a build, then commit/push M1 only when explicitly authorized. Transfer the reviewed M1 work through Git before switching machines.

For the next authorized M2 task: read repository instructions and state, reproduce tests/build and the known lint baseline, then verify the exact production OpenAI/Astra API model identifier and supported API interface. Select a secure server execution boundary compatible with the verified hosting setup, define request/response schemas using the normalized intake, add server input/output validation and production rate limiting, and keep credentials server-side. Objective: secure server-side OpenAI/Astra integration with schema-validated structured output. Do not infer the model identifier from the developer's display name, and do not introduce M5 payments.
