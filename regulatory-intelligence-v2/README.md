# MONAISEC Regulatory Intelligence Engine V2 (research preview)

## What this package adds
- Deployment-profile assessment across jurisdiction, organisation role, financial activity, autonomy, authority, customer impact, data, outsourcing and regulatory perimeter.
- A provision-level obligation library with conditions, legal force, evidence prompts, control domains and primary-source links.
- Separate outputs for potentially applicable, conditional/verify and contextual references.
- JSON and CSV assessment exports.
- Imported V0.2 workbook records: 26 regulatory-register entries, 14 research/evidence entries and 12 agent-risk crosswalk entries.
- Official-source discovery registry and a conservative GitHub Actions collector for the FSB and BIS RSS feeds that creates a human-review queue; it never rewrites legal records. EUR-Lex, MAS, NIST, ESMA, SEC and FCA are listed for manual verification; their complete change APIs are not yet integrated.

## Repository layout and deployment

Serve the repository root with `python -m http.server 8000` and open
`http://localhost:8000/regulatory-intelligence-v2/`. GitHub Pages serves the same
layout. Keep the page in `regulatory-intelligence-v2/`, the shared files under
`assets/` and `data/`, and the collector at `scripts/review_feed.py`.

The homepage and regulatory register link to the engine.
`.github/workflows/regulatory-watch-v2.yml` runs the collector from the repository
root and commits changes to `data/regulatory-watch-v2.json`.

## Current scope and limitations
- This is a rule-based research triage prototype, not a legal expert system. It does not determine definitive applicability.
- The 11 obligation rules are an initial curated subset, not a complete obligation corpus. The 26 source-register records are inherited from the V0.2 research workbook; not all have been independently re-verified in this build.
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

## Document import and PDF delivery

The browser loads the pinned PDF.js 6.5.438 parser from `assets/vendor/pdfjs/`
when a visitor selects a PDF. It extracts text from up to 30 pages of a 10 MB
PDF. The initial phrase matching supports English deployment briefs. The
visitor reviews suggested fields, resolves conflicts and confirms the full
profile. Original bytes, filenames and excerpts stay in the browser.
Scanned files can use the paste or manual workflow.

The standard PDF is served from `assets/reports/`. It is the same download
and email attachment for all visitors. To refresh the fixed PDF, run
`python scripts/build_scoping_brief.py` with ReportLab, Pillow and Liberation Sans installed. Set
`MONAISEC_FONT_DIR` if your fonts use a different directory.

### Activate email delivery

1. In Brevo, verify that `monaisec.com` is authenticated and
   `contact@monaisec.com` is an active sender. Create a Brevo API key for the
   Worker. Review transactional log retention and preview settings.
2. Create a Cloudflare Turnstile widget for `api.monaisec.com`. The widget
   is hosted in the Worker iframe on that hostname.
3. The public site key is set in `workers/mapper-mail/wrangler.toml`. If the
   Worker is new, deploy it with `wrangler deploy` from `workers/mapper-mail/`
   before adding secrets. In Cloudflare, open **Workers & Pages → monaisec-mapper-mail
   → Settings → Variables and Secrets** and add `TURNSTILE_SECRET` and
   `BREVO_API_KEY` as **Secret** variables. Enable email only after the PDF
   is available on GitHub Pages. The Worker downloads that fixed public PDF.
4. Open the Mapper on `https://monaisec.com`, run an assessment and request
   the PDF using an inbox you control. Check the visible From address,
   authentication headers, attachment and where a reply goes. An API
   acceptance is separate from receipt in the destination inbox.

The worker accepts one email and one Turnstile token per request, uses the
same fixed attachment for every visitor, and keeps no application database
of addresses or documents. Brevo receives the address and standard
attachment to deliver the message. The Worker uses Cloudflare's per-location
request limits. The PDF download remains available if email is disabled.
