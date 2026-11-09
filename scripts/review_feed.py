#!/usr/bin/env python3
"""Conservative discovery collector. Creates candidates; never edits legal records."""
import json, re, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
registry=json.loads((ROOT/'data/source-registry-v2.json').read_text())
watch=ROOT/'data/regulatory-watch-v2.json'
existing=json.loads(watch.read_text()) if watch.exists() else []
seen={x.get('url') for x in existing}
terms=re.compile(r'agentic|artificial intelligence|machine learning|algorithmic trading|operational resilience|cyber|outsourc|payment|market access|data protection|financial institution',re.I)
for src in registry:
 if src['mode']!='automated' or 'feed' not in src['endpoint']: continue
 try:
  req=urllib.request.Request(src['endpoint'],headers={'User-Agent':'MONAISEC-Regulatory-Research/2.0 (+https://monaisec.com)'})
  raw=urllib.request.urlopen(req,timeout=25).read(); root=ET.fromstring(raw)
  for item in root.findall('.//item')+root.findall('.//{http://www.w3.org/2005/Atom}entry'):
   title=item.findtext('title') or item.findtext('{http://www.w3.org/2005/Atom}title') or ''
   link=item.findtext('link') or ''
   if not link:
    el=item.find('{http://www.w3.org/2005/Atom}link'); link=el.attrib.get('href','') if el is not None else ''
   desc=item.findtext('description') or item.findtext('{http://www.w3.org/2005/Atom}summary') or ''
   if link and link not in seen and terms.search(title+' '+desc):
    existing.append({'id':'WATCH-'+str(abs(hash(link)))[:10],'source_id':src['id'],'title':re.sub('<[^>]+>',' ',title),'url':link,'discovered_at':datetime.now(timezone.utc).isoformat(),'status':'needs_human_review','note':'Discovery candidate only. Verify primary document, legal force, exact provisions, jurisdiction, publication/effective dates and whether the item changes an existing record.'});seen.add(link)
 except Exception as e: print(f"WARN {src['id']}: {e}")
watch.write_text(json.dumps(existing,indent=2,ensure_ascii=False))
print(f"Review queue contains {len(existing)} candidate(s). No regulatory record was automatically modified.")
