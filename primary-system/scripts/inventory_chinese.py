"""Read-only Chinese coverage inventory; run through manage.py shell."""
import json,collections
from pathlib import Path
from django.conf import settings
from django.utils import timezone
from words.models import ScenarioWord
from lexicon.models import ContentEntryLink,LexiconSource
from lexicon.chinese import selected_payload

def binding_key(obj):
    return json.dumps([str(obj.sense_id),str(obj.pronunciation_id),str(obj.evidence_id),obj.editorial_snapshot],sort_keys=True,ensure_ascii=False)

def inventory():
    refs=[]
    for domain,objects in [('target',ScenarioWord.objects.select_related('target__evidence__release__source','scenario','target__sense','target__pronunciation','target__chinese_version')),('link',ContentEntryLink.objects.select_related('evidence__release__source','content','sense','pronunciation','chinese_version'))]:
        for item in objects:
            obj=item.target if domain=='target' else item
            record,status,chinese=selected_payload(obj)
            evidence=obj.evidence
            legacy=(obj.editorial_snapshot.get('definition') or evidence.definition) if evidence else ''
            category='已确认已采用' if record and obj.chinese_version_id else '失效或歧义' if not record else '已有中文未经本轮核对' if any('\u3400'<=c<='\u9fff' for c in legacy) else '缺中文'
            places=[{'book':p.unit.textbook_book.code,'unit':p.unit.code,'order':p.order} for p in item.content.placements.select_related('unit__textbook_book')] if domain=='link' else [{'scenario':item.scenario.code,'order':item.order}]
            refs.append({'domain':domain,'reference_id':str(item.pk),'object_id':str(obj.pk),'label':obj.label if domain=='target' else obj.selected_headword,
                'positions':places,'sense_id':str(obj.sense_id),'pronunciation_id':str(obj.pronunciation_id) if obj.pronunciation_id else None,
                'evidence_id':str(obj.evidence_id),'snapshot':obj.editorial_snapshot,'source_code':evidence.release.source.code if evidence else None,
                'source_key':evidence.binding.external_key if evidence else None,'release_id':str(evidence.release_id) if evidence else None,
                'release_version':evidence.release.version if evidence else None,'release_checksum':evidence.release.checksum if evidence else None,
                'lexical_hash':evidence.lexical_hash if evidence else None,'raw_hash':evidence.raw_hash if evidence else None,
                'gloss_language':obj.sense.gloss_language if obj.sense_id else None,'source_definition':evidence.definition if evidence else '',
                'source_pronunciation':evidence.pronunciation_value if evidence else '', 'pronunciation_reviewed':obj.pronunciation.is_reviewed if obj.pronunciation_id else None,
                'legacy_chinese':legacy if any('\u3400'<=c<='\u9fff' for c in legacy) else '',
                'chinese_version_id':str(obj.chinese_version_id) if obj.chinese_version_id else None,
                'presentation_revision':obj.presentation_revision,'selection_revision':getattr(obj,'selection_revision',None),
                'status':status,'category':category,'binding_key':binding_key(obj),'not_in_first_batch_reason':'未纳入本批常用范围；保留现有legacy，后续逐项核对'})
    domains={d:{r['binding_key'] for r in refs if r['domain']==d} for d in ['target','link']}
    shapes=collections.defaultdict(set)
    for r in refs: shapes[r['label'].casefold()].add(r['sense_id'])
    strict={d:{r['label'] for r in refs if r['domain']==d} for d in ['target','link']}
    candidates=json.loads(Path('data/chinese/cn-foundation-20261102-01.json').read_text())
    chosen={(e['selection']['domain'],e['selection']['object_id']) for e in candidates['entries']}
    blockers={('target','light'):'场景义项混合n.灯／adj.轻的，教学范围待核；不改原目标',('target','maths book'):'音标/mɑːθs/与常见英式/mæθs/存在疑点，另行核查',('target','orange'):'场景义项混合n.橙子／adj.橙色的，范围待核',('link','light'):'教材自身v.照亮／n.灯；光的动词／名词边界待核，不含轻的'}
    for r in refs:
        r['not_in_first_batch_reason']='本批候选' if (r['domain'],r['object_id']) in chosen else blockers.get((r['domain'],r['label']),'未纳入本批常用范围，后续逐条核对')
    summary={'strict_form_domain_intersection':len(strict['target']&strict['link']),'form_comparison':'同形多Sense组按casefold比较，严格两域同形交集保留大小写；May=五月与may=可以不能合并', 'references':len(refs),'scenario_references':sum(r['domain']=='target' for r in refs),'textbook_references':sum(r['domain']=='link' for r in refs),
        'targets':len({r['object_id'] for r in refs if r['domain']=='target'}),'unique_fixed_bindings':len(domains['target']|domains['link']),
        'domain_binding_intersection':len(domains['target']&domains['link']),'same_form_multiple_senses':{k:sorted(v) for k,v in shapes.items() if len(v)>1},
        'reference_categories':dict(collections.Counter(r['category'] for r in refs)),
        'binding_categories':dict(collections.Counter(next(r['category'] for r in refs if r['binding_key']==key) for key in domains['target']|domains['link']))}
    return {'database':str(settings.DATABASES['default']['NAME']),'at':timezone.localtime().isoformat(),'sources':list(LexiconSource.objects.values('code','active_release_id')),'summary':summary,'references':refs}

