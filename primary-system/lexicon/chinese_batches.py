"""Fixed curated Chinese batch, all-or-nothing, no spelling-wide propagation."""
import hashlib,json,uuid
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import (ChineseBatchReceipt,ChineseSenseVersion,ChineseReview,ContentEntryLink,ContentLinkSelection,
                     LexiconSource,Sense,Pronunciation,SourceRecord)
from .chinese import create_chinese,review_chinese,adopt_chinese,selection_record,validate_version
from words.models import LearningTarget,ScenarioWord,TargetChineseAdoption
from catalog.models import ContentItem


def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def resolve(entry):
    s=entry['selection']
    records=SourceRecord.objects.filter(release__source__code=s['source_code'],release__version=s['release_version'],
        release__checksum=s['release_checksum'],binding__external_key=s['source_key'],raw_hash=s['raw_hash'],lexical_hash=s['lexical_hash'])
    if records.count()!=1: raise ValidationError(f"{entry['key']}: 固定来源定位缺失或歧义")
    record=records.get()
    if s['domain']=='target':
        ids=set(ScenarioWord.objects.filter(scenario__code__in=[p['scenario'] for p in s['positions']],
            target__evidence=record,en=s['label']).values_list('target_id',flat=True))
        if len(ids)!=1: raise ValidationError(f"{entry['key']}: 显式场景定位不唯一")
        obj=LearningTarget.objects.get(pk=ids.pop())
    else:
        links=ContentEntryLink.objects.filter(content__source_key=s['content_source_key'],slot=s['slot'],evidence=record)
        if links.count()!=1: raise ValidationError(f"{entry['key']}: 教材稳定位置不唯一")
        obj=links.get()
    if str(obj.pk)!=s['object_id'] or str(record.pk)!=s['evidence_id'] or str(obj.sense_id)!=s['sense_id'] or (str(obj.pronunciation_id) if obj.pronunciation_id else None)!=s['pronunciation_id']:
        raise ValidationError(f"{entry['key']}: 批准UUID不匹配，跨环境须先重新映射并审核清单")
    if s['domain']=='target':
        positions=[{'scenario':w.scenario.code,'order':w.order} for w in obj.placements.select_related('scenario')]
        if not obj.placements.filter(pk=s['reference_id']).exists(): raise ValidationError('批准词位已改变')
    else:
        positions=[{'book':p.unit.textbook_book.code,'unit':p.unit.code,'order':p.order} for p in obj.content.placements.select_related('unit__textbook_book')]
    if sorted(positions,key=lambda x:json.dumps(x,sort_keys=True))!=sorted(s['positions'],key=lambda x:json.dumps(x,sort_keys=True)):
        raise ValidationError(f"{entry['key']}: 批准的完整位置集合发生漂移")
    if obj.editorial_snapshot!=s['snapshot'] or obj.sense_id!=record.binding.sense_id or obj.pronunciation_id!=record.binding.pronunciation_id:
        raise ValidationError(f"{entry['key']}: 固定修订／义项／读音漂移")
    current,status=selection_record(obj)
    if not current: raise ValidationError(f"{entry['key']}: {status}")
    if obj.pronunciation_id and not obj.pronunciation.is_reviewed: raise ValidationError(f"{entry['key']}: 读音未核对")
    return obj,record


def expected_fields(entry,batch_id,checksum,record):
    return {'text':entry['text'],'example':entry['example'],'kind':entry['kind'],'origin':entry['origin'],
        'generation_tool':entry['generation_tool'],'author_label':entry['author_label'],'learning_effect':entry['learning_effect'],
        'provenance':f"{batch_id}/{entry['key']} sha256:{checksum}; {record.release.source.code}:{record.binding.external_key}; AI独立复核，非用户或人工审校",
        'change_reason':entry['same_reason']}


@transaction.atomic
def import_batch(manifest,*,reviewer,dry_run=False,expected_digest=None):
    if manifest.get('review_status')!='approved' or reviewer!=manifest.get('reviewer'):
        raise ValidationError('清单尚未获得匹配身份的固定批次审核结论')
    checksum=digest(manifest)
    if not dry_run and expected_digest!=checksum: raise ValidationError('必须提交与审核文件一致的expected-digest')
    if any(e.get('review_status')!='approved' for e in manifest['entries']): raise ValidationError('条目尚未完成固定审核')
    if not reviewer.startswith('AI:'): raise ValidationError('本批复核身份须如实标为AI。')
    entries=manifest['entries']; keys=[e['key'] for e in entries]
    if not entries or len(keys)!=len(set(keys)): raise ValidationError('空批次或重复row key')
    if any(e['learning_effect']!='same' for e in entries): raise ValidationError('本批只允许明确same项目，改义另建身份')
    resolved=[(e,*resolve(e)) for e in entries]
    # Stable multi-source locking before revalidation; no current revision is auto-filled.
    for pk in sorted({r.release.source_id for _,_,r in resolved}): LexiconSource.objects.select_for_update().get(pk=pk)
    for pk in sorted({o.sense_id for _,o,_ in resolved},key=str): Sense.objects.select_for_update().get(pk=pk)
    for pk in sorted({o.pronunciation_id for _,o,_ in resolved if o.pronunciation_id},key=str): Pronunciation.objects.select_for_update().get(pk=pk)
    for pk in sorted({o.content_id for _,o,_ in resolved if isinstance(o,ContentEntryLink)},key=str): ContentItem.objects.select_for_update().get(pk=pk)
    for model in (LearningTarget,ContentEntryLink):
        list(model.objects.select_for_update().filter(pk__in=[o.pk for _,o,_ in resolved if isinstance(o,model)]).order_by('pk'))
    resolved=[(e,*resolve(e)) for e,_,_ in resolved]
    receipt=ChineseBatchReceipt.objects.select_for_update().filter(pk=manifest['batch_id']).first()
    if receipt and (receipt.digest!=checksum or receipt.manifest!=manifest): raise ValidationError('批次标识已被不同清单占用')
    expected=[]
    for e,obj,record in resolved:
        vid=uuid.uuid5(uuid.NAMESPACE_URL,'primary-system/chinese-batch/'+manifest['batch_id']+'/'+e['key'])
        version=ChineseSenseVersion.objects.filter(pk=vid).first()
        fields=expected_fields(e,manifest['batch_id'],checksum,record)
        base=e['selection']['presentation_revision']
        if receipt:
            if not version or version.previous_id is not None or version.locale!='zh-Hans-CN' or any(getattr(version,k)!=v for k,v in fields.items()): raise ValidationError(f"{e['key']}: 正文／来源归属漂移")
            validate_version(obj,version)
            if version.review_revision!=1 or obj.chinese_version_id!=vid or obj.presentation_revision!=base+1:
                raise ValidationError(f"{e['key']}: 撤回、核对或人工采用漂移")
            reviews=list(ChineseReview.objects.filter(version=version))
            if len(reviews)!=1 or reviews[0].reviewer!=reviewer or reviews[0].decision!='confirmed': raise ValidationError('核对历史漂移')
            if isinstance(obj,LearningTarget):
                h=TargetChineseAdoption.objects.filter(target=obj,revision=base+1,version=version,reason=f"{manifest['batch_id']}/{e['key']}: {e['same_reason']}")
                if h.count()!=1: raise ValidationError('采用历史漂移')
            else:
                if obj.selection_revision!=e['selection']['selection_revision']+1: raise ValidationError('教材选择历史漂移')
                h=ContentLinkSelection.objects.filter(link=obj,revision=obj.selection_revision,selection__chinese_version_id=str(vid))
                from .chinese import link_snapshot
                if h.count()!=1 or h.get().selection!=link_snapshot(obj) or h.get().reason!=f"{manifest['batch_id']}/{e['key']}: {e['same_reason']}": raise ValidationError('教材采用历史缺失或漂移')
        else:
            if version or obj.chinese_version_id is not None or obj.presentation_revision!=base or (isinstance(obj,ContentEntryLink) and obj.selection_revision!=e['selection']['selection_revision']):
                raise ValidationError(f"{e['key']}: 首导前采用状态漂移")
        expected.append((e,obj,record,vid,fields))
    if receipt:
        if receipt.outcome!={e['key']:{'object':str(obj.pk),'version':str(vid)} for e,obj,_,vid,_ in expected}:
            raise ValidationError('批次持久归属发生漂移')
        outcome={'batch_id':manifest['batch_id'],'digest':checksum,'created':0,'unchanged':len(entries),'dry_run':dry_run}
    else:
        for e,obj,record,vid,fields in expected:
            version=create_chinese(id=vid,evidence_id=record.pk,expected_snapshot=e['selection']['snapshot'],**fields)
            review_chinese(version.pk,expected_revision=0,decision='confirmed',reviewer=reviewer,note=f"{manifest['batch_id']}/{e['key']}: 主控AI逐条审核通过；{e['same_reason']}")
            kwargs={'target_id':obj.pk} if isinstance(obj,LearningTarget) else {'link_id':obj.pk}
            adopt_chinese(**kwargs,version_id=version.pk,expected_revision=e['selection']['presentation_revision'],expected_review_revision=1,reason=f"{manifest['batch_id']}/{e['key']}: {e['same_reason']}")
        ChineseBatchReceipt.objects.create(batch_id=manifest['batch_id'],digest=checksum,manifest=manifest,
            outcome={e['key']:{'object':str(obj.pk),'version':str(vid)} for e,obj,_,vid,_ in expected})
        outcome={'batch_id':manifest['batch_id'],'digest':checksum,'created':len(entries),'unchanged':0,'dry_run':dry_run}
    if dry_run: transaction.set_rollback(True)
    return outcome
