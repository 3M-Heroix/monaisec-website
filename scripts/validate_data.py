#!/usr/bin/env python3
import json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]; D=ROOT/'data'; errors=[]
def load(n):
 try:return json.loads((D/(n+'.json')).read_text(encoding='utf-8'))
 except Exception as e: errors.append(f'{n}.json: {e}'); return {}
def records(db,key='records'): return db.get(key,[]) if isinstance(db,dict) else []
regs=load('regulations'); threats=load('threats'); risks=load('financial-risks'); graph=load('knowledge-graph'); scenarios=load('scenarios'); sources=load('sources'); method=load('methodology')
sets={ 'regulations':{x.get('id') for x in records(regs)}, 'threats':{x.get('id') for x in records(threats)}, 'financial-risks':{x.get('id') for x in records(risks)}, 'sources':{x.get('id') for x in records(sources)} }
def check_unique(name,items):
 ids=[x.get('id') for x in items];
 if len(ids)!=len(set(ids)): errors.append(name+': duplicate IDs')
 for i in ids:
  if not i: errors.append(name+': missing ID')
for name,db in [('regulations',regs),('threats',threats),('financial-risks',risks),('sources',sources)]: check_unique(name,records(db))
check_unique('graph nodes',graph.get('nodes',[])); nodeids={x.get('id') for x in graph.get('nodes',[])}
for e in graph.get('edges',[]):
 for k in ('source','target'):
  if e.get(k) not in nodeids: errors.append(f'knowledge graph edge has unresolved {k}: {e.get(k)}')
for r in records(threats):
 for rid in r.get('related_regulatory_records',[]):
  if rid not in sets['regulations']: errors.append(f"{r.get('id')}: unknown regulation {rid}")
for r in records(risks):
 for rid in r.get('related_threats',[]):
  if rid not in sets['threats']: errors.append(f"{r.get('id')}: unknown threat {rid}")
 for rid in r.get('related_regulations',[]):
  if rid not in sets['regulations']: errors.append(f"{r.get('id')}: unknown regulation {rid}")
for s in records(scenarios,'scenarios'):
 for rid in s.get('threat_ids',[]):
  if rid not in sets['threats']: errors.append(f"{s.get('id')}: unknown threat {rid}")
 for rid in s.get('risk_ids',[]):
  if rid not in sets['financial-risks']: errors.append(f"{s.get('id')}: unknown risk {rid}")
 for rid in s.get('regulation_ids',[]):
  if rid not in sets['regulations']: errors.append(f"{s.get('id')}: unknown regulation {rid}")
for p in ['index.html','regulatory.html','threats.html','knowledge-graph.html','financial-risks.html','scenario-lab.html','sources.html','methodology.html','404.html']:
 if not (ROOT/p).exists(): errors.append('missing page '+p)
print(f"Records: regulations={len(sets['regulations'])}, threats={len(sets['threats'])}, financial_risks={len(sets['financial-risks'])}, scenarios={len(records(scenarios,'scenarios'))}, sources={len(sets['sources'])}, graph_nodes={len(nodeids)}, graph_edges={len(graph.get('edges',[]))}")
if errors:
 print('VALIDATION FAILED'); print('\n'.join('- '+e for e in errors)); sys.exit(1)
print('VALIDATION PASSED')
