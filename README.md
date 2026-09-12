# BIMCode Solutions Website

BIMCode Solutions provides BIM automation, Revit API, Python, pyRevit, and AI-assisted workflow solutions for AEC companies. Current offerings are BIM Automation Audit, Automation Sprint (displayed as Revit Automation Sprint), and Automation Retainer (displayed as BIM Automation Retainer).

## Production and stack

Production URL: https://www.bimcodesolutions.com (provided by the project owner).

Static React 18 single-page application using Vite 7, React Router 6, Tailwind CSS 3, PostCSS/Autoprefixer, and lucide-react icons. Vercel configuration is checked in as `vercel.json`. The hosting account, linked repository, production branch, and dashboard settings are not recorded and require owner verification. There is no application backend, database, authentication, payment system, or AI integration in this repository.

## Local development

Prerequisites: Git, npm, and Node.js satisfying Vite's engine requirement (`^20.19.0 || >=22.12.0`). Install from the committed lockfile; do not copy `node_modules` between machines.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run lint
```

- `dev`: starts Vite; use the printed local URL.
- `build`: produces static assets in `dist/`.
- `preview`: serves the production build locally; build first. This is not a production server.
- `lint`: invokes `eslint .`; the repository currently lacks ESLint configuration. See `PROJECT_STATE.md` for validation results.
- No test script, suite, or test runner is configured.

## Environment variables and contact

No environment variables are required for installation, build, or local operation.

| Variable | Required | Behavior |
| --- | --- | --- |
| `VITE_CONTACT_FORM_ENDPOINT` | No | Public JSON POST endpoint. Empty/absent opens a prefilled email in the visitor's email application; the visitor must send it. |

Copy `.env.example` to `.env.local` when configuring an endpoint. Restart development or rebuild after changing it. Set equivalent public values in the deployment build environment. Vite embeds `VITE_*` values in browser assets: never use credentials, API keys, or URLs containing secrets.

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
| `src/theme/` | Light/dark theme, system preference, localStorage persistence |
| `src/index.css`, `tailwind.config.js`, `postcss.config.js` | Global CSS, class-based dark mode, brand palette, CSS processing |
| `src/assets/`, `public/` | Bundled media and directly copied public assets |
| `vite.config.js`, `vercel.json` | React build plugin and SPA rewrite |
| `dist/` | Generated production output, currently tracked in Git |
| `PROJECT_STATE.md` | Canonical milestone status and cross-machine handoff |
| `docs/AI_TASKS.md` | Empty legacy placeholder |
| `git-filter-repo.py` | History utility, outside application runtime/build |

Routes: `/`, `/solutions`, `/case-study`, `/blog`, `/blog/:slug`. `/products` redirects to `/solutions`. Unknown paths show the not-found page; unknown blog slugs redirect to `/blog`. Content comes from local JavaScript, with no CMS or remote content API. `/audit` is planned.

## Deployment

The repository-supported workflow is `npm ci`, `npm run build`, then static hosting of `dist/`. `vercel.json` rewrites `/(.*)` to `/index.html` for SPA route loads. Preserve this fallback if changing hosts.

No deployment script, CI workflow, Vercel project link, or automatic Git deployment trigger is checked in. Before releasing, verify the linked Vercel project, production branch/domain, Node version, build command, output directory, and public contact endpoint with the owner. Do not assume a push deploys production. Rebuild from source; tracked `dist/` may be stale and generated changes need separate review.

After an authorized deployment, check direct route loads/refreshes, the `/products` redirect, unknown routes, theme switching, and contact behavior. Verify delivery separately with an authorized test submission.

## Development rules

- Preserve production behavior unless the milestone explicitly requires changes; avoid redesigns and broad refactors.
- Read `AGENTS.md` if present, this README, and `PROJECT_STATE.md` before work. The repository is the source of truth.
- Never commit secrets or expose API keys client-side. Future AI integration needs a server boundary.
- Validate before committing: configured tests if present, lint, production build, and diff review. Record existing failures explicitly.
- Update `PROJECT_STATE.md` after meaningful milestones with decisions, validation, defects, Git state, and the exact next action.
