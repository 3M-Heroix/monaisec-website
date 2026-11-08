#!/usr/bin/env python3
"""Collect official regulatory publication feeds into a human-review queue.

This script never edits regulations.json or mapper-rules.json. Feed entries are
untrusted leads and must be checked against the primary publication before use.
"""
from __future__ import annotations
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SOURCES_FILE = DATA / "regulatory-sources.json"
WATCH_FILE = DATA / "regulatory-watch.json"
KEYWORDS = [
    "artificial intelligence", "ai agent", "agentic", "automated decision",
    "algorithmic", "machine learning", "model risk", "operational resilience",
    "outsourcing", "third-party", "cyber", "payment", "trading", "market abuse",
    "financial stability", "digital operational resilience", "dora", "ai act",
    "data protection", "consumer duty", "supervisory", "consultation",
    "guideline", "guidance", "regulation", "standard", "risk management"
]
NS = {"atom": "http://www.w3.org/2005/Atom"}

def fetch(url: str, accept: str = "application/rss+xml, application/atom+xml, application/xml, text/xml") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent":"MONAISEC-Regulatory-Watch/1.0 (+https://monaisec.com)","Accept":accept})
    with urllib.request.urlopen(req, timeout=35) as response:
        return response.read(5_000_000)

def local_text(el, paths):
    for path in paths:
        found = el.find(path, NS)
        if found is not None and found.text:
            return found.text.strip()
    return ""

def parse_feed(xml_bytes: bytes, source: dict) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items = root.findall(".//item")
    if not items:
        items = root.findall(".//atom:entry", NS)
    out = []
    for item in items:
        title = local_text(item, ["title", "atom:title"])
        link = local_text(item, ["link"])
        if not link:
            link_el = item.find("atom:link", NS)
            if link_el is not None:
                link = link_el.attrib.get("href", "")
        summary = local_text(item, ["description", "summary", "content", "atom:summary", "atom:content"])
        published = local_text(item, ["pubDate", "date", "updated", "published", "atom:updated", "atom:published"])
        text = (title + " " + summary).lower()
        matched = [k for k in KEYWORDS if k in text]
        if not title or not link or not matched:
            continue
        out.append({
            "source_id": source["id"], "publisher": source.get("publisher", source["name"]),
            "title": title, "url": link, "summary": re.sub(r"<[^>]+>", " ", summary)[:1200],
            "published": published, "matched_terms": matched[:12],
            "status": "needs_review", "discovered_at": dt.datetime.now(dt.timezone.utc).isoformat()
        })
    return out

def cellar_items(source: dict, since: str) -> list[dict]:
    results = []
    start = (dt.date.fromisoformat(since[:10]) - dt.timedelta(days=1)).isoformat()
    for action in ("CREATE", "UPDATE"):
        query = urllib.parse.urlencode({"startDate": start, "type": action, "wemiClasses": "work"})
        xml = fetch(source["feed_url"] + "?" + query, "application/rss+xml")
        root = ET.fromstring(xml)
        for item in root.findall(".//item"):
            classes = [x.text or "" for x in item.findall(".//{*}class")]
            if classes and not any("resource_legal" in c for c in classes):
                continue
            ids = [x.text or "" for x in item.findall(".//{*}identifier")]
            if not ids:
                continue
            date = local_text(item, ["{*}date"])
            cellar_id = local_text(item, ["{*}cellarId"])
            title = "EU legal document metadata " + action.lower()
            url = "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=" + urllib.parse.quote(" ".join(ids))
            # Cellar metadata does not always expose a human-readable title in the notification.
            if cellar_id:
                results.append({
                    "source_id": source["id"], "publisher": source.get("publisher", source["name"]),
                    "title": title + (": " + ", ".join(ids[:3]) if ids else ""),
                    "url": url, "summary": "Cellar notification: " + action + ". Identifiers: " + ", ".join(ids),
                    "published": date, "matched_terms": matched or ["EU legal document update"],
                    "cellar_id": cellar_id, "status": "needs_review",
                    "discovered_at": dt.datetime.now(dt.timezone.utc).isoformat()
                })
    return results

def main():
    sources_doc = json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    previous = json.loads(WATCH_FILE.read_text(encoding="utf-8")) if WATCH_FILE.exists() else {"items":[]}
    since = previous.get("last_checked_at") or (dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=3)).isoformat()
    old = previous.get("items", [])
    known = {x.get("url") for x in old}
    collected, failures = [], []
    for source in sources_doc.get("sources", []):
        if source.get("status") != "automated":
            continue
        try:
            if source.get("type") == "official_document_change_feed":
                items = cellar_items(source, since)
            else:
                items = parse_feed(fetch(source["feed_url"]), source)
            for item in items:
                if item["url"] not in known:
                    collected.append(item)
                    known.add(item["url"])
            print(f"OK {source['id']}: {len(items)} candidate(s)")
        except Exception as exc:
            failures.append({"source_id":source["id"],"error":str(exc)[:300]})
            print(f"WARN {source['id']}: {exc}", file=sys.stderr)
    merged = collected + old
    merged.sort(key=lambda x: x.get("discovered_at",""), reverse=True)
    output = {
        "dataset_title":"MONAISEC Regulatory Watch Queue", "dataset_version":"1.0.0",
        "last_checked_at":dt.datetime.now(dt.timezone.utc).isoformat(),
        "window_start":since, "items":merged[:300], "source_failures":failures,
        "note":"Feed items are discovery leads. A researcher must inspect the primary source, classify legal status and amend curated records manually."
    }
    WATCH_FILE.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"Added {len(collected)} new review candidates; {len(failures)} source failures.")

if __name__ == "__main__":
    main()
