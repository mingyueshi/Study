"""Original-row hashes with an exact 39-pointer whitelist; no plaintext original business rows."""
import sqlite3,json,hashlib,uuid,argparse,os
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('database');p.add_argument('baseline');p.add_argument('--verify',action='store_true');a=p.parse_args()
m=json.loads(Path('data/chinese/cn-foundation-20261102-01.json').read_text());db=sqlite3.connect(a.database)
def h(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,default=str).encode()).hexdigest()
def key(table,value):return h(value) if table=='django_session' else str(value)
allowed={}
for e in m['entries']:
 s=e['selection'];t='words_learningtarget' if s['domain']=='target' else 'lexicon_contententrylink'
 ident=uuid.UUID(s['object_id']).hex if s['domain']=='target' else s['object_id']
 new={'chinese_version_id':uuid.uuid5(uuid.NAMESPACE_URL,'primary-system/chinese-batch/'+m['batch_id']+'/'+e['key']).hex,'presentation_revision':s['presentation_revision']+1}
 old={'chinese_version_id':None,'presentation_revision':s['presentation_revision']}
 if s['domain']=='link':new['selection_revision']=s['selection_revision']+1;old['selection_revision']=s['selection_revision']
 allowed[t,ident]=(old,new)
file=Path(a.baseline)
if not a.verify:
 if file.exists():raise SystemExit('refuse overwrite baseline')
 tables={}
 for t, in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"):
  cols=[r[1] for r in db.execute('PRAGMA table_info("'+t+'")')]
  tables[t]={'columns':cols,'rows':{key(t,r[0]):h(list(r)) for r in db.execute('SELECT * FROM "'+t+'"')}}
 file.write_text(json.dumps(tables));os.chmod(file,0o600);print('baseline recorded',sum(len(v['rows']) for v in tables.values()))
else:
 tables=json.loads(file.read_text());fail=[];adds={};changed=0
 for t,b in tables.items():
  rows={}
  for r in db.execute('SELECT '+','.join('"'+c+'"' for c in b['columns'])+' FROM "'+t+'"'):
   values=dict(zip(b['columns'],r));ident=str(r[0])
   if (t,ident) in allowed:
    old,new=allowed[t,ident]
    if any(values[c]!=v for c,v in new.items()):fail.append(t+':unexpected pointer:'+ident)
    values.update(old);changed+=1
   rows[key(t,r[0])]=h([values[c] for c in b['columns']])
  if any(rows.get(k)!=v for k,v in b['rows'].items()):fail.append(t+':old row changed/missing')
  adds[t]=len(rows.keys()-b['rows'].keys())
 limits={'lexicon_chinesesenseversion':39,'lexicon_chinesereview':39,'words_targetchineseadoption':26,'lexicon_contentlinkselection':13,'django_migrations':1,'django_content_type':1,'auth_permission':4}
 for t,n in adds.items():
  if n!=limits.get(t,0):fail.append(t+':unexpected additions:'+str(n))
 newtables={t for t, in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")}-set(tables)
 if newtables!={'lexicon_chinesebatchreceipt'}:fail.append('unexpected new tables')
 if db.execute('SELECT count(*) FROM lexicon_chinesebatchreceipt').fetchone()[0]!=1:fail.append('receipt count')
 result={'passed':not fail,'original_rows':sum(len(v['rows']) for v in tables.values()),'pointer_rows':changed,'additions':adds,'failures':fail,'integrity':db.execute('PRAGMA integrity_check').fetchone()[0]}
 out=file.with_name(file.stem+'-result.json');out.write_text(json.dumps(result,indent=2));os.chmod(out,0o600);print(json.dumps(result))
 if fail:raise SystemExit(1)
