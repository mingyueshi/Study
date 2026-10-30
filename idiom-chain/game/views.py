import json,secrets
from django.db import transaction, OperationalError
from django.core.cache import cache
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.cache import never_cache
from .models import Idiom,Round

@never_cache
def index(request): return render(request,'game/index.html')
def owner(request):
    if 'player' not in request.session: request.session['player']=secrets.token_hex(24)
    return request.session['player']
def current(request):
    key=owner(request)
    qs=Round.objects.filter(owner=key,status='playing').order_by('-created_at')
    r=qs.first()
    if r: return r
    with transaction.atomic():
        r=qs.first()
        if not r:
            start=Idiom.objects.filter(word='一心一意',enabled=True,game_eligible=True).first()
            opening={'word':'一心一意','meaning':'心思专一，专心致志。'}
            if start: opening.update(meaning=start.meaning,idiom_id=start.pk,pinyin=start.pinyin)
            r=Round.objects.create(owner=key,chain=[opening])
    return r
def candidates(r):
    return Idiom.objects.filter(enabled=True,game_eligible=True,first_char=r.chain[-1]['word'][-1]).exclude(word__in=[x['word'] for x in r.chain]).order_by('word')
def dictionary_counts():
    result=cache.get('dictionary_counts')
    if result is None:
        result=(Idiom.objects.filter(enabled=True,game_eligible=True).count(),Idiom.objects.filter(enabled=True).count())
        cache.set('dictionary_counts',result,60)
    return result
def payload(r):
    playable,total=dictionary_counts()
    return {'id':str(r.id),'revision':r.revision,'score':r.score,'hints':r.hints,'chain':r.chain,'next_char':r.chain[-1]['word'][-1],'status':r.status,'dictionary_count':playable,'total_dictionary_count':total,'history':[{'score':x.score,'length':len(x.chain)-1,'created_at':x.created_at.isoformat()} for x in Round.objects.filter(owner=r.owner).exclude(pk=r.pk).order_by('-created_at')[:5]]}
def body(request,r):
    if len(request.body)>1024: raise ValueError('请求过大。')
    try: data=json.loads(request.body)
    except (ValueError,UnicodeDecodeError): raise ValueError('请求格式不正确。')
    if not isinstance(data,dict): raise ValueError('请求格式不正确。')
    if data.get('round_id')!=str(r.id) or data.get('revision')!=r.revision: raise ValueError('对局已更新，请刷新后再试。')
    return data
def mutate(fn):
    @never_cache
    @require_POST
    def wrapped(request):
        try:
            with transaction.atomic():
                r=current(request)
                data=body(request,r)
                result,extra=fn(request,r,data)
            response=payload(result)
            response.update(extra)
            return JsonResponse(response)
        except ValueError as e:
            return JsonResponse({'error':str(e)},status=409 if '已更新' in str(e) else 400)
        except OperationalError:
            return JsonResponse({'error':'数据库暂忙，请稍后刷新再试。'},status=503)
    return wrapped
@never_cache
@require_GET
def state(request):
    return JsonResponse(payload(current(request)))
@mutate
def play(request,r,data):
    word=data.get('word','')
    if not isinstance(word,str) or len(word.strip())!=4: raise ValueError('请输入四字成语。')
    word=word.strip()
    if word in [x['word'] for x in r.chain]: raise ValueError('这个成语已经用过了，换一个吧。')
    item=Idiom.objects.filter(word=word,enabled=True).first()
    if not item: raise ValueError('未收录这个成语，请尝试词库中的其他成语。')
    if not item.game_eligible: raise ValueError('这个词可在词典查阅，但尚未通过四字接龙基本检查。')
    if word[0]!=r.chain[-1]['word'][-1]: raise ValueError('请以“'+r.chain[-1]['word'][-1]+'”字开头，不使用谐音。')
    r.chain.append({'word':word,'meaning':item.meaning,'idiom_id':item.pk,'pinyin':item.pinyin});r.score+=10;r.revision+=1;r.save()
    return r,{}
@mutate
def hint(request,r,data):
    item=candidates(r).first()
    if not item: raise ValueError('当前精选词库没有可接的成语，本局已走到尽头；可以重新开始。')
    r.score=max(0,r.score-5);r.hints+=1;r.revision+=1;r.save()
    return r,{'hint':{'id':item.pk,'word':item.word,'meaning':item.meaning,'pinyin':item.pinyin}}
@mutate
def restart(request,r,data):
    r.status='finished';r.revision+=1;r.save()
    return current(request),{}


def idiom_detail_data(item):
    return {key:getattr(item,key) for key in ('id','word','pinyin','meaning','derivation','example','abbreviation','reading_status','game_eligible','source','source_url','source_version','source_explanation','source_raw')} | {'relations_available':False,'summary':item.meaning if item.meaning != item.source_explanation else '', 'source_missing':not bool(item.source_raw)}

@require_GET
def idiom_search(request):
    q=request.GET.get('q','').strip()[:64]
    qs=Idiom.objects.filter(enabled=True).defer('source_raw','derivation','example').order_by('word','id')
    if q: qs=qs.filter(Q(word__contains=q)|Q(pinyin__icontains=q.casefold())|Q(abbreviation__iexact=q))
    pages=Paginator(qs,20)
    page=pages.get_page(request.GET.get('page',1))
    return JsonResponse({'results':[{'id':x.id,'word':x.word,'pinyin':x.pinyin,'meaning':x.meaning,'reading_status':x.reading_status,'game_eligible':x.game_eligible} for x in page], 'page':page.number,'pages':pages.num_pages,'total':pages.count})

@require_GET
def idiom_detail(request,pk):
    return JsonResponse(idiom_detail_data(get_object_or_404(Idiom,pk=pk,enabled=True)))

@require_GET
def idiom_lookup(request):
    return JsonResponse(idiom_detail_data(get_object_or_404(Idiom,word=request.GET.get('word','')[:64],enabled=True)))
