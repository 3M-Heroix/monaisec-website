# MONAISEC Website V2 — Regulatory Intelligence

This release preserves the V1 homepage and adds the first functional research feature: a global Regulatory Intelligence register.

## Contents
- `index.html` — existing V1 homepage, updated to link to Regulatory Intelligence.
- `regulatory.html` — responsive regulatory database interface.
- `data/regulations.json` — structured seed dataset (12 records).
- `assets/css/regulatory.css` — page styling.
- `assets/js/regulatory.js` — filtering, search, record profiles and CSV export.

## Deploy to GitHub Pages
Upload the contents of this folder to the root of your existing GitHub repository (keep the folders). Commit to the branch configured in Settings → Pages. No build step is required.

If replacing an existing site, keep a local copy of the current repository before overwriting. The `index.html` here is based on the V1 delivered in this project and includes the new Regulatory Intelligence navigation link.

## Test locally
Because the page fetches `data/regulations.json`, do not open `regulatory.html` as a `file://` URL. From this folder run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Database methodology and limitations
- The 12 records are a curated seed dataset, not an exhaustive global inventory.
- Primary official publisher sources are linked for each record.
- Legal force and agentic-AI relevance are separate classifications.
- No arbitrary global strictness score is used.
- Summaries are analytical research notes, not legal advice.
- The dataset snapshot is marked 7 November 2026. Records must be rechecked when legal texts, effective dates or guidance change.
- Some records are adjacent frameworks, standards initiatives or technical guidance rather than legislation. Their non-binding status is explicitly stated.
- The OWASP Agentic Applications record's version date is flagged for confirmation against its version history before being treated as a finalized bibliographic citation.

## Updating records
Edit `data/regulations.json`. Preserve each record's unique `id`, use ISO dates (`YYYY-MM-DD`), and update `last_verified` only after checking the official publisher source. Keep the `verification_note` concise and specific. Do not label an instrument binding unless the legal text supports that classification.

## Feature status
Implemented: responsive register, live keyword search, filters for jurisdiction/instrument/legal force/agent relevance, primary-source verification toggle, record detail modal, official source links, and CSV export.

Not included yet: user accounts, server-side search, automated legal monitoring, admin editing interface, API integrations or legal advice.
