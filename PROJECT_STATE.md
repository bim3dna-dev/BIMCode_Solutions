# BIMCode Solutions — Project State

## Metadata

- Last updated: 2026-09-12 (Europe/Sarajevo).
- Current branch: `main`.
- Latest relevant commit: `f58c1ec6151fc99ef2b14c21bfccec9bb49f3fa0` — Add Vercel SPA rewrite configuration (2026-09-01).
- Current milestone: M0 — Repository Baseline and Cross-Machine Handoff. Complete locally with pre-existing validation gaps documented; commit/push remains the transfer step.
- M1 has not started. This file is the canonical handoff; do not rely on chat history.

## Production State

The owner reports the website live at https://www.bimcodesolutions.com. The repository contains a static React/Vite website and Vercel SPA rewrite configuration. The deployed commit, live hosting account/settings, automatic deployment trigger, and production contact endpoint have not been independently verified. No production deployment or contact submission was performed during M0.

The current BIM Automation Audit is a consultancy inquiry offering. The planned interactive AI Automation Audit does not exist yet: no `/audit`, server/API layer, model integration, report purchase, payment provider, or conversion analytics implementation exists.

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

Documentation, environment baseline, and validated repository state. Scope is documentation/repository state only; preserve application behavior. See validation and handoff sections for completion status.

### M1 — AI Audit Product Surface

Not started. Add `/audit`, an Audit landing page, and workflow intake UX. No production AI dependency yet.

### M2 — AI Audit Engine

Not started. Introduce secure server-side integration with the selected OpenAI model, structured outputs, and schema validation. The developer refers to an available model as GPT-6 Astra; this is not a verified production API identifier. Verify the exact API model identifier and supported interface before integration. Credentials must never reach browser code. No model identifier is selected during M0.

### M3 — Dynamic Diagnostic Interview

Not started. Ask only questions needed to resolve ambiguity in workflow analysis. Account for BIM/AEC and Revit workflow constraints.

### M4 — Automation Report and ROI Engine

Not started. Produce workflow summary, automation feasibility and score, current manual effort, estimated annual effort, potential savings, assumptions, technical architecture, deterministic versus AI responsibilities, estimated implementation complexity, and recommended BIMCode engagement. Calculate arithmetic and ROI deterministically in application code whenever possible.

### M5 — Commercial Conversion

Not started. Implement free preview, paid full report, payment flow, Automation Sprint CTA, Retainer CTA, lead capture, and conversion analytics. Payment provider is undecided; do not invent one during M0.

### M6 — Knowledge-Grounded Recommendations

Not started. Ground recommendations in verified BIMCode capabilities and case studies. Candidate areas: Revit QA, connector inspection, MEP automation, tagging, print automation, AI-assisted model workflows, image/symbol recognition, and Revit family generation.

Current source supports website descriptions of QA, tagging, sheet/print/export automation, MEP workflows, pyRevit tooling, and experimental drawing recognition (`src/data/content.js`, `src/pages/CaseStudyPage.jsx`). These descriptions do not establish quantified customer results. Connector inspection and family generation need supporting evidence before capability claims. Keep experimental capabilities labeled as such.

### M7 — Distribution Engine

Not started. Generate marketing drafts for meaningful events: `PRODUCT_LAUNCHED`, `MAJOR_FEATURE_SHIPPED`, `CASE_STUDY_PUBLISHED`, `CUSTOMER_RESULT`, `NEW_AUTOMATION_CAPABILITY`, `IMPORTANT_PRODUCT_LEARNING`.

Initial flow: event → draft generated → human approval → publication. Never automatically publish arbitrary Git commits. Keep LinkedIn integration behind an abstraction independent of any specific social API implementation.

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

## Validation and Known Issues

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

Pre-existing issues and limits:

- No ESLint configuration despite a lint script; no test script/suite.
- `src/sections/LogosSection.jsx` imports `partnerLogos`, which is not exported by `src/data/content.js`. It is unused by the current page graph; mounting it would require a fix.
- Generated `dist/` is tracked. Builds can dirty the working tree; review artifacts separately from source changes.
- Dependency installation reports deprecated packages, including ESLint 8. No dependency upgrade is included; installation with `--no-audit` is not a security audit.
- Production deployment settings, contact provider/delivery, and deployed revision remain unverified. Browser interaction and live production behavior are not covered by a build.

## Exact Next Action

Finish reviewing and commit/push the M0 documentation and environment baseline to make this handoff available on the second machine. No commit or push is performed implicitly by this milestone.

For the next authorized M1 session: read the handoff files, inspect Git status/log, install and reproduce the validation baseline, then implement `/audit` in `src/App.jsx` with a dedicated landing page and workflow intake UI using the existing layout/styles. Define intake validation and a local non-AI submission/preview state. Keep existing consultation/contact behavior intact. Do not add an AI API call, invent a model identifier, or begin payments. M1 implementation must wait for its own task.
