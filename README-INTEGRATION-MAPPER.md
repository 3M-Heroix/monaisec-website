# MONAISEC Regulatory Compliance Mapper — V1

## What this adds
- `regulatory-mapper.html`: interactive, browser-local regulatory scoping tool.
- `assets/css/regulatory-mapper.css` and `assets/js/regulatory-mapper.js`: responsive UI and mapping logic.
- `data/mapper-rules.json`: transparent, analyst-authored screening rules and control prompts.
- `data/regulatory-records-additions.json`: a proposed GDPR seed record consumed by the mapper and ready for review/merging into the main register.
- `data/regulatory-sources.json`: official publication feeds and manually reviewed source directories.
- `data/regulatory-watch.json`: automatically refreshed candidate queue.
- `scripts/update_regulatory_watch.py`: RSS/Atom and EU Cellar update collector.
- `.github/workflows/regulatory-watch.yml`: daily scheduled collection plus manual trigger.

## Integration with the existing MONAISEC V7 research platform
1. Back up the current GitHub Pages repository.
2. Extract this package into the repository root, preserving its folder structure.
3. Confirm the existing `data/regulations.json` remains present. The mapper reads its current records and merges the proposed GDPR record from `data/regulatory-records-additions.json`; it does not replace the existing register. Review that proposed record, then merge it into `data/regulations.json` if approved.
4. Add a navigation link to `regulatory-mapper.html` in `index.html` and `regulatory.html`, for example:
   `<a href="regulatory-mapper.html">Compliance Mapper</a>`
5. Commit and push to the GitHub Pages branch.
6. In GitHub, open Actions and run **MONAISEC regulatory source watch** once manually. Confirm the workflow can commit `data/regulatory-watch.json`.
7. Open `https://YOUR-DOMAIN/regulatory-mapper.html` and test the profiles below.

## First-run requirements
- GitHub Actions must be enabled.
- Repository Actions settings must permit workflows to create and approve pull requests / write repository contents as needed. This workflow only writes the review-queue JSON.
- GitHub Pages serves the generated JSON file on the next deployment.
- No API keys or paid services are required.

## What "up to date" means in V1
The workflow checks configured official RSS/Atom feeds once per day and adds keyword-matched entries to a review queue. The EU Cellar collector requests legal-document creation and update notifications. The feed monitor does **not** decide whether an item changes a law, whether it applies to a specific institution, or whether an existing mapping must change.

Some authorities do not expose a stable public feed for all regulatory publications. MAS and NIST are therefore listed as official directories for manual review, not falsely represented as automated feeds. FCA's feed covers news and warnings and is not a complete feed of all FCA policy publications. Coverage is not exhaustive.

## Research workflow
1. A feed item enters `data/regulatory-watch.json` as `needs_review`.
2. Researcher opens the original source and confirms publisher, publication date, document type and legal status.
3. Researcher checks the primary text, territorial scope, entity scope, applicability, commencement and transition provisions.
4. Researcher updates `data/regulations.json` and `data/mapper-rules.json` in a reviewed commit.
5. Reviewer records `last_verified`, verification note and any interpretation caveats.
6. Run the existing `validate_data.py` and test the mapper after every dataset change.

## Important limitations
- The mapper is a first-pass scoping assistant, not legal advice or compliance certification.
- A candidate match is not a finding of applicability.
- The current rule set is intentionally small and transparent. It is not an exhaustive global regulatory corpus.
- The profile and checklist are processed locally in the browser; they are not transmitted to MONAISEC.
- Do not add personal, confidential or institution-sensitive information to the profile.
- The current rule set references the existing V7 regulation IDs. If an ID is missing from `data/regulations.json`, that mapping will not render.
- The GDPR mapping uses a separately packaged proposed seed record so it can be reviewed before being merged into the main regulatory register. Verify its current consolidated text and national supervisory guidance before treating it as publication-ready.
