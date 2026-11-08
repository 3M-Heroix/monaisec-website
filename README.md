# MONAISEC V7 — Complete static research platform

MONAISEC is an independent research initiative examining security, reliability, governance and systemic risks of autonomous AI agents in financial and monetary systems. This release consolidates the five research modules and adds the missing research-governance foundation.

## Site map

- `index.html` — institutional homepage and research navigation.
- `regulatory.html` — Regulatory Intelligence register.
- `threats.html` — Threat & Vulnerability Intelligence taxonomy.
- `knowledge-graph.html` — cross-register relationship explorer.
- `financial-risks.html` — Financial Risk Observatory.
- `scenario-lab.html` — qualitative Agentic Finance Scenario Lab.
- `sources.html` — searchable, deduplicated source registry.
- `methodology.html` — research principles, evidence classes, event types and limitations.
- `404.html`, `robots.txt`, `sitemap.xml` — basic site operations and discoverability.

## Deployment to GitHub Pages

1. Download and extract the V7 ZIP.
2. Back up the current GitHub repository contents.
3. Upload the *contents* of `monaisec-v7/` to the repository root (not the enclosing folder and not the ZIP).
4. Preserve the `assets/`, `data/` and `scripts/` directories. Replace corresponding files with V7 versions.
5. Commit to the branch configured under repository Settings → Pages.
6. After deployment, test every page, source links, JSON fetches, mobile navigation and the 404 page. Confirm HTTPS and custom-domain settings remain intact.

The site is static and requires no build step. Test locally with `python -m http.server 8000` from this directory. Do not open JSON-fetching pages via `file://`.

## Research governance

Read `methodology.html` and `DATA_DICTIONARY.md` before adding records. The source registry is generated from URLs already present in the source datasets. Its presence does not mean every source was re-verified on the registry generation date. Use record-level verification dates and notes.

Evidence classes distinguish primary sources, independently corroborated evidence, secondary sources, unverified claims and analytical hypotheses. Event types distinguish observed incidents, demonstrated attacks, known vulnerabilities, threat patterns and analytical scenarios. Never represent a scenario or taxonomy pattern as an observed financial-sector incident without evidence.

Legal force and agent relevance are separate dimensions. Cross-links and graph edges are analytical unless a cited source explicitly states the relationship. No universal legal strictness, probability, expected-loss or systemic-risk score is calculated.

## Data maintenance

- Keep stable unique IDs; never recycle deleted IDs.
- Use ISO dates (`YYYY-MM-DD`) and update `last_verified` only after checking the underlying source.
- Preserve provenance, scope, caveats and verification notes.
- Update `CHANGELOG.md` for material changes.
- Run `python scripts/validate_data.py` before publishing.
- Rebuild `sources.json` when adding/removing source URLs. Review registry mappings.
- Rebuild `knowledge-graph.json` when related registers change; inspect every relationship before publication.

## Current limitations

No backend, login, database service, editor interface, automated source monitoring, incident submission pipeline or alerting is included. Dataset coverage is curated and incomplete. This is not legal, investment, supervisory, audit or operational advice.
