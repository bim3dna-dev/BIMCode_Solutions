# BIMCode Solutions Website

BIMCode Solutions provides BIM automation, Revit API, Python, pyRevit, and AI-assisted workflow solutions for AEC companies. Current offerings are BIM Automation Audit, Automation Sprint (displayed as Revit Automation Sprint), and Automation Retainer (displayed as BIM Automation Retainer).

## Production and stack

Production URL: https://www.bimcodesolutions.com (provided by the project owner).

React 18/Vite 7 single-page application using React Router 6, Tailwind CSS 3, PostCSS/Autoprefixer, and lucide-react icons. A Vercel Node.js function provides workflow assessment through the official OpenAI SDK. Zod defines shared validation contracts. M3 uses an expiring Redis REST store for interview state; there is no account or payment system. Deployment account/settings and API enablement must be verified with the owner; the analysis endpoint is disabled by default until production protections are configured.

## Local development

Prerequisites: Git, npm, and Node.js 22.12+ (Node 24 validated for both Vite and the API). Install from the committed lockfile; do not copy `node_modules` between machines.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run lint
npm test
```

- `dev`: starts Vite; use the printed local URL.
- `build`: produces static assets in `dist/`.
- `preview`: serves the production build locally; build first. This is not a production server.
- `lint`: invokes `eslint .`; the repository currently lacks ESLint configuration. See `PROJECT_STATE.md` for validation results.
- `npm test`: Node's built-in test runner for intake, server boundary, output validation, and mocked SDK transport. No live model call or browser dependency is required.
- For local API development, use Node 22.12+ (validated on Node 24), copy `.env.example` to ignored `.env.local`, and run `npm run dev:api` in a second terminal alongside `npm run dev`. Vite proxies `/api` to the local-only adapter on `127.0.0.1:3001`. Set `AUDIT_ALLOWED_ORIGIN` to the exact Vite browser origin, including its port. `npm run preview` serves only built frontend assets; it does not run Vercel functions.
- `npm run test:live` is an explicit **billable** provider smoke test using synthetic workflow data. It requires a server-side key and never runs with `npm test`. See [Audit backend operations](docs/AUDIT_BACKEND.md).

## Environment variables and contact

No environment variables are needed for installation, frontend builds, or offline tests. The analysis service requires server configuration:

| Variable | Required | Behavior |
| --- | --- | --- |
| `VITE_CONTACT_FORM_ENDPOINT` | No | Public JSON POST endpoint. Empty/absent opens a prefilled email in the visitor's email application; the visitor must send it. |
| `OPENAI_API_KEY` | For analysis | Server-side secret only; never use a `VITE_` prefix or commit a real key. |
| `OPENAI_MODEL` | No | Server-selected model, default `gpt-6-astra`. Client model overrides are rejected. |
| `AUDIT_ANALYSIS_ENABLED` | For analysis | Defaults to disabled. Set exactly `true` only after model access and production rate limiting are verified. |
| `AUDIT_INTERVIEW_ENABLED` | For M3 | Defaults to disabled. Set exactly `true` only in a prepared deployment with shared state and both WAF rules. |
| `AUDIT_STATE_REDIS_REST_URL` | For M3 | HTTPS root URL of an Upstash-compatible Redis REST database supporting GET and atomic EVAL/SET with expiry. |
| `AUDIT_STATE_REDIS_REST_TOKEN` | For M3 | Server-only read/write token; never expose with a VITE prefix. |
| `AUDIT_ALLOWED_ORIGIN` | For analysis | One exact browser origin, no trailing slash, e.g. `https://www.bimcodesolutions.com`. Use the actual preview origin for preview testing. |

Copy `.env.example` to ignored `.env.local` for local configuration. Restart the relevant development process after changes. Configure server variables in the Vercel environment settings, never in browser code. Vite embeds `VITE_*` values in browser assets: only public contact configuration belongs there. Do not broaden Vite's environment prefix to expose server secrets.

`src/sections/ContactSection.jsx` handles inquiry types `audit`, `tool`, and `retainer`, required name/email/workflow fields, optional company, submission feedback, and the email fallback. Query parameters such as `/?inquiry=tool#contact` select the inquiry type. JSON fields are `inquiryType`, `intent`, `fullName`, `email`, `company`, `workflowToAutomate`, `timestamp`, and `source`. The endpoint must accept JSON and allow the website origin through CORS. Failed endpoint requests show an error and contact email; they do not automatically send email.

No Formspree SDK, Formspree-specific endpoint, or integration exists in the checked-in source. The actual production endpoint/provider and delivery are unverified.

## Architecture

| Path | Responsibility |
| --- | --- |
| `index.html`, `src/main.jsx` | HTML entry, React root, theme provider, browser router |
| `src/App.jsx` | Route definitions |
| `src/pages/` | Home, solutions, case study, blog list/detail, not-found views |
| `src/components/` | Shared layout, header, footer, theme toggle |
| `src/sections/` | Homepage sections and contact form; not all sections are mounted |
| `src/data/content.js` | Static offers, solutions, benefits, outcomes, services, blog posts |
| `src/features/audit/` | Intake options, validation, normalization, JSDoc model, and model tests |
| `shared/` | Shared intake enums/limits, strict normalized input and assessment schemas |
| `api/audit/analyze.js`, `api/audit/interview.js` | Vercel Node.js assessment and interview entry points |
| `server/audit/` | Bounded request handling, provider boundary/instructions, safe usage logging, offline tests |
| `scripts/` | Local HTTP adapter and explicit live API smoke test |
| `src/theme/` | Light/dark theme, system preference, localStorage persistence |
| `src/index.css`, `tailwind.config.js`, `postcss.config.js` | Global CSS, class-based dark mode, brand palette, CSS processing |
| `src/assets/`, `public/` | Bundled media and directly copied public assets |
| `vite.config.js`, `vercel.json` | React build plugin and SPA rewrite |
| `dist/` | Generated production output, currently tracked in Git |
| `PROJECT_STATE.md` | Canonical milestone status and cross-machine handoff |
| `docs/AI_TASKS.md` | Empty legacy placeholder |
| `git-filter-repo.py` | History utility, outside application runtime/build |

Routes: `/`, `/solutions`, `/case-study`, `/blog`, `/blog/:slug`, `/audit`. `/products` redirects to `/solutions`. Contact is the homepage section at `/#contact`, not a `/contact` route. Unknown paths show the not-found page; unknown blog slugs redirect to `/blog`. Content comes from local JavaScript, with no CMS or remote content API.

The Audit flow is intake -> review -> explicit Analyze Workflow -> zero to four focused diagnostic questions -> technical assessment. The browser starts `/api/audit/interview` with a normalized intake and a random idempotency ID, then sends only the session/question IDs and each answer. `/api/audit/analyze` takes the ready interview ID. The server owns history, strips contact identity, caps decision calls at four and final calls at one, and validates all outputs. Original form data stays intact on interview restart; draft/result state clears on navigation or refresh. Free text is not automatically anonymized. No lead is silently submitted. The manual-review CTA still opens `/?inquiry=audit#contact` without transferring intake details. No ROI arithmetic is implemented.

M3 requires an externally configured **shared Redis REST store**, using the existing platform `fetch` rather than another SDK. Workflow context, diagnostic answers, and the cached assessment expire after 30 minutes; contact fields are never stored there. See [M3 operations and Preview gates](docs/AUDIT_BACKEND.md#m3-dynamic-diagnostic-interview) for provisioning, WAF limits, failure/retry behavior, and explicit manual live tests. Offline tests use mocked storage and provider transport and need no credentials.

**M3 is not activated or deployed by this change.** Keep `AUDIT_INTERVIEW_ENABLED=false` until Preview has its state store, origin, and differentiated WAF rules. The M3 frontend requires those services; do not deploy it to Production before validation. With the flag off, the existing M2 final API contract remains available, but the new interview route fails closed. With it on, the final endpoint requires a ready server session and rejects legacy direct-intake requests.

## Deployment

The repository-supported Vercel workflow installs with `npm ci`, builds frontend assets with `npm run build`, serves `dist/`, and deploys `api/audit/analyze.js` and `api/audit/interview.js` as Node.js functions with a 60-second maximum duration. `vercel.json` excludes `/api` paths from the SPA fallback so API requests cannot become HTML. Plain static hosting alone cannot provide analysis. See [Audit backend operations](docs/AUDIT_BACKEND.md) for the mandatory rate-limit and deployment checks before enabling paid model calls.

No deployment script, CI workflow, Vercel project link, or automatic Git deployment trigger is checked in. Before releasing, verify the linked Vercel project, production branch/domain, Node version, build command, output directory, and public contact endpoint with the owner. Do not assume a push deploys production. Rebuild from source; tracked `dist/` may be stale and generated changes need separate review.

After an authorized deployment, check direct route loads/refreshes, the `/products` redirect, unknown routes, theme switching, and contact behavior. Verify delivery separately with an authorized test submission.

## Development rules

- Preserve production behavior unless the milestone explicitly requires changes; avoid redesigns and broad refactors.
- Read `AGENTS.md` if present, this README, and `PROJECT_STATE.md` before work. The repository is the source of truth.
- Never commit secrets or expose API keys client-side. Future AI integration needs a server boundary.
- Validate before committing: configured tests if present, lint, production build, and diff review. Record existing failures explicitly.
- Update `PROJECT_STATE.md` after meaningful milestones with decisions, validation, defects, Git state, and the exact next action.


## Site languages and social links

M2.3 uses a small React LocaleProvider with static English, Netherlands Dutch, German, and Bosnian copy in `src/i18n/translations.js`. Components translate only presentation text via `useLocale().t`; missing strings fall back to their English source. Add each new public string to all locale columns. No runtime translation service or additional i18n dependency is used.

English is the first-visit default. The header's native language select persists `en`, `nl`, `de`, or `bs` under `bimcode_locale` in localStorage and updates the document language. Blocked storage falls back safely to in-memory selection. Routes are unchanged; About and Contact remain `/#about` and `/#contact`. Locale-prefixed SEO routes/hreflang are a future consideration.

Audit labels, options, explanatory text, and errors are localized at display time. Canonical enum values and intake normalization remain unchanged. User-entered content and generated Astra prose are not translated; non-English UI includes an English-assessment note. Multilingual AI output is deferred. Native browser validation UI follows browser settings.

Footer destinations live in `src/data/social-links.js`. LinkedIn, X, Instagram, and the owner-supplied XING destination open in new tabs with accessible labels. YouTube is omitted until a verified public channel URL is supplied; the existing homepage video is not a channel URL. Social posting remains manual/approval-based until M7.
