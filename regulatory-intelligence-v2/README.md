# MONAISEC Regulatory Intelligence Engine V2 (research preview)

## What this package adds
- Deployment-profile assessment across jurisdiction, organisation role, financial activity, autonomy, authority, customer impact, data, outsourcing and regulatory perimeter.
- A provision-level obligation library with conditions, legal force, evidence prompts, control domains and primary-source links.
- Separate outputs for potentially applicable, conditional/verify and contextual references.
- JSON and CSV assessment exports.
- Imported V0.2 workbook records: 26 regulatory-register entries, 14 research/evidence entries and 12 agent-risk crosswalk entries.
- Official-source discovery registry and a conservative GitHub Actions collector for the FSB and BIS RSS feeds that creates a human-review queue; it never rewrites legal records. EUR-Lex, MAS, NIST, ESMA, SEC and FCA are listed for manual verification; their complete change APIs are not yet integrated.

## Install
Copy the package contents into the root of the existing MONAISEC GitHub Pages repository. Keep the existing `data/regulations.json`, `regulatory.html`, threat, graph and other research modules intact. The new engine uses its own files with `-v2` suffixes to avoid overwriting existing datasets.

Add a navigation link to the existing homepage and regulatory page:

```html
<a href="regulatory-intelligence-v2/index.html">Regulatory Mapper V2</a>
```

If copying package contents directly into repository root, instead link to `regulatory-intelligence-v2/index.html` only if you preserve the folder. To host at root, move `index.html`, `assets`, `data`, `scripts` and `.github/workflows/regulatory-watch-v2.yml` into root carefully, renaming assets/data files to avoid collisions.

Recommended safe deployment: keep this package in a dedicated `regulatory-intelligence-v2/` folder. Copy `.github/workflows/regulatory-watch-v2.yml` to the repository-root `.github/workflows/` directory (GitHub only discovers workflows there). The workflow is already configured to execute `regulatory-intelligence-v2/scripts/review_feed.py` and commit only the review queue. GitHub Pages can serve the app at `/regulatory-intelligence-v2/`.

## Local test
Run from the package folder:

```bash
python -m http.server 8000
```
Open `http://localhost:8000`. The page must be served over HTTP because it loads JSON using `fetch()`.

## Current scope and limitations
- This is a rule-based research triage prototype, not a legal expert system. It does not determine definitive applicability.
- The 10 obligation rules are an initial curated subset, not a complete obligation corpus. The 26 source-register records are inherited from the V0.2 research workbook; not all have been independently re-verified in this build.
- Applicability results are heuristic. Review each condition, underlying legal text, entity perimeter, territorial scope, role allocation, effective date, exemptions and national implementation.
- “Potentially applicable” means the profile matches the configured screening conditions; it is not a legal opinion.
- Source monitoring is discovery only. Some sources are manual. RSS absence is not evidence that no changes occurred.
- No LLM or external API is required; no user data leaves the browser.

## Immediate next research build
1. Expand to article/paragraph-level obligations for EU AI Act, DORA, GDPR, MiFID II/MAR, UK FCA/PRA, US SEC/FINRA/GLBA, Singapore MAS, China and Morocco.
2. Add instrument version history, amendment diffs, commencement calendars and source snapshots/hashes.
3. Add evidence-to-control tests, control owners, design/operating effectiveness and audit trails.
4. Add jurisdiction-specific transposition links and regulator interpretations.
5. Add signed reviewer approvals and a downloadable assessment dossier.

## Research provenance
The workbook source files were `Monaisec_AI_Agent_Regulatory_Database_v0.2.xlsx` and v0.1. Additional official-source checks for this build include:
- FSB final AI sound practices (15 Oct 2026): https://www.fsb.org/2026/10/sound-practices-for-responsible-adoption-of-artificial-intelligence-ai-final-report/
- MAS AI Risk Management Guidelines (7 Oct 2026; effective 7 Oct 2027): https://www.mas.gov.sg/regulation/guidelines/guidelines-on-artificial-intelligence-risk-management-for-financial-institutions
- EUR-Lex AI Act consolidated text (27 Jul 2026): https://eur-lex.europa.eu/legal-content/en/ALL/?uri=CELEX:02024R1689-20260727
- ESMA MiFID II Article 17: https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mifid-ii/article-17-algorithmic-trading
- US eCFR Rule 15c3-5: https://www.ecfr.gov/current/title-17/section-240.15c3-5

Build date: 2026-11-09.
