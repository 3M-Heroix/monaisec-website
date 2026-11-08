# Data dictionary and minimum record contract

All datasets are UTF-8 JSON. Top-level metadata should include `dataset_title`, `dataset_version`, `last_reviewed`, and `methodology`. Dates use ISO `YYYY-MM-DD`. IDs are stable and unique within each register.

- `regulations.json`: `records[]` of instruments with issuer, jurisdiction, publication/effective dates, legal force, agent relevance, scope, summary, official URLs, evidence class, verification note and caveat.
- `threats.json`: `records[]` of threat patterns with description, financial scenario, potential impact, mitigations, framework mappings, evidence maturity, source URLs and related regulation IDs.
- `financial-risks.json`: `records[]` of risk channels with agent exposure/pathway, financial functions, transmission, consequences, monitoring indicators, control themes, evidence class, sources and related record IDs.
- `knowledge-graph.json`: `nodes[]` and `edges[]`; every edge endpoint must resolve to a node. Edges must be interpreted under the graph methodology; analytical edges are not source assertions.
- `scenarios.json`: `scenarios[]` with starting conditions, ordered sequence, control gates, impact path and linked threat/risk/regulation IDs. Scenarios are analytical unless explicitly evidenced otherwise.
- `sources.json`: deduplicated source URLs and linked record IDs. Registry membership is not a fresh verification event.
- `methodology.json`: versioned public description of evidence classes, event types, risk-method limitations and review cadence.

Never infer an observed incident from a threat taxonomy entry or scenario. Never infer legal applicability from a graph edge alone.
