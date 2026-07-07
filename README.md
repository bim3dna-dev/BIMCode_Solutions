# BIMCode Solutions Website

BIMCode Solutions is a founder-led BIM automation consultancy focused on Revit-first engineering workflows. The website presents services for BIM Managers, MEP engineering teams, and Revit production teams that need custom automation, pyRevit tooling, Dynamo/Python workflows, BIM QA systems, Revit API development, and AI-assisted BIM workflows.

## Tech stack

- React
- Vite
- React Router
- Tailwind CSS
- lucide-react

## Local development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Contact form configuration

The contact form can submit to a static-friendly JSON endpoint.

Set this environment variable in the deployment platform:

```bash
VITE_CONTACT_FORM_ENDPOINT=https://example.com/contact-endpoint
```

When `VITE_CONTACT_FORM_ENDPOINT` is configured, the form sends a JSON `POST` payload with inquiry type, name, email, company/team, workflow description, timestamp, and source.

When the variable is missing, the form falls back to a prefilled `mailto:` link to `bimcodesolutions@gmail.com` so messages are not silently discarded.

## Deployment notes

- Deploy the generated `dist/` folder after `npm run build`.
- Configure SPA fallback routing so `/solutions`, `/case-study`, and other React routes return `index.html`.
- Keep `/products` supported as a redirect to `/solutions`.
- Verify the contact endpoint accepts JSON and handles CORS for the deployed domain.
