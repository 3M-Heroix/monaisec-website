#!/usr/bin/env python3
"""Collect official-source candidates for human review."""
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from update_regulatory_watch import NS, fetch, local_text

DATA = Path(__file__).resolve().parents[1] / "data"
TERMS = re.compile(
    r"agentic|artificial intelligence|machine learning|algorithmic trading|"
    r"operational resilience|cyber|outsourc|payment|market access|data protection|financial institution",
    re.I,
)


def collect(source):
    root = ET.fromstring(fetch(source["endpoint"]))
    if root.tag.split("}")[-1] not in {"rss", "RDF", "feed"}:
        raise ValueError(f"Unexpected feed root: {root.tag}")
    for item in root.findall(".//{*}item") + root.findall(".//atom:entry", NS):
        title = local_text(item, ["{*}title"])
        link = local_text(item, ["{*}link"])
        if not link:
            for element in item.findall("{*}link"):
                if element.get("rel", "alternate") == "alternate" and element.get("href"):
                    link = element.attrib["href"]
                    break
        summary = local_text(item, ["{*}description", "{*}summary", "{*}content"])
        if title and link and TERMS.search(f"{title} {summary}"):
            yield {
                "id": "WATCH-" + hashlib.sha256(link.encode()).hexdigest()[:16],
                "source_id": source["id"],
                "title": re.sub("<[^>]+>", " ", title),
                "url": link,
                "discovered_at": datetime.now(timezone.utc).isoformat(),
                "status": "needs_human_review",
                "note": "Discovery candidate only. Verify the primary document, legal force, provisions, jurisdiction and dates.",
            }


def main():
    registry = json.loads((DATA / "source-registry-v2.json").read_text(encoding="utf-8"))
    watch = DATA / "regulatory-watch-v2.json"
    existing = json.loads(watch.read_text(encoding="utf-8")) if watch.exists() else []
    seen = {item["url"] for item in existing}
    successes = 0
    failures = 0
    initial_size = len(existing)
    for source in registry:
        if source["mode"] != "automated":
            continue
        try:
            items = list(collect(source))
        except Exception as error:
            failures += 1
            print(f"WARN {source['id']}: {error}", file=sys.stderr)
            continue
        successes += 1
        print(f"OK {source['id']}: {len(items)} candidate(s)")
        for item in items:
            if item["url"] not in seen:
                existing.append(item)
                seen.add(item["url"])
    if not successes:
        raise SystemExit("No automated source completed. The existing review queue was preserved.")
    if len(existing) != initial_size or not watch.exists():
        watch.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Review queue contains {len(existing)} candidate(s). {failures} source(s) failed.")


if __name__ == "__main__":
    main()
