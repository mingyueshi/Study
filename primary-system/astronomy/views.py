from django.core.paginator import Paginator
from django.db.models import Q
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache
from reference_library.models import Dataset
from .models import CelestialRecord
from .importing import VERSION

CONSTELLATIONS = dict(
    pair.split(":", 1)
    for pair in """And:仙女座 Ant:唧筒座 Aps:天燕座 Aqr:宝瓶座 Aql:天鹰座 Ara:天坛座 Ari:白羊座 Aur:御夫座 Boo:牧夫座 Cae:雕具座 Cam:鹿豹座 Cnc:巨蟹座 CVn:猎犬座 CMa:大犬座 CMi:小犬座 Cap:摩羯座 Car:船底座 Cas:仙后座 Cen:半人马座 Cep:仙王座 Cet:鲸鱼座 Cha:蝘蜓座 Cir:圆规座 Col:天鸽座 Com:后发座 CrA:南冕座 CrB:北冕座 Cru:南十字座 Crt:巨爵座 Crv:乌鸦座 Cyg:天鹅座 Del:海豚座 Dor:剑鱼座 Dra:天龙座 Equ:小马座 Eri:波江座 For:天炉座 Gem:双子座 Gru:天鹤座 Her:武仙座 Hor:时钟座 Hya:长蛇座 Hyi:水蛇座 Ind:印第安座 Lac:蝎虎座 Leo:狮子座 LMi:小狮座 Lep:天兔座 Lib:天秤座 Lup:豺狼座 Lyn:天猫座 Lyr:天琴座 Men:山案座 Mic:显微镜座 Mon:麒麟座 Mus:苍蝇座 Nor:矩尺座 Oct:南极座 Oph:蛇夫座 Ori:猎户座 Pav:孔雀座 Peg:飞马座 Per:英仙座 Phe:凤凰座 Pic:绘架座 Psc:双鱼座 PsA:南鱼座 Pup:船尾座 Pyx:罗盘座 Ret:网罟座 Sge:天箭座 Sgr:人马座 Sco:天蝎座 Scl:玉夫座 Sct:盾牌座 Ser:巨蛇座 Sex:六分仪座 Tau:金牛座 Tel:望远镜座 Tri:三角座 TrA:南三角座 Tuc:杜鹃座 UMa:大熊座 UMi:小熊座 Vel:船帆座 Vir:室女座 Vol:飞鱼座 Vul:狐狸座""".split()
)


def rows():
    return (
        CelestialRecord.objects.filter(source_version=VERSION)
        if Dataset.objects.filter(code="hyg", state="ready").exists()
        else CelestialRecord.objects.none()
    )


def decorate(row):
    row.constellation_zh = CONSTELLATIONS.get(row.constellation, "未提供／中文名暂缺")
    return row


@never_cache
def index(request):
    q = request.GET.get("q", "").strip()
    named = request.GET.get("named", "")
    con = request.GET.get("con", "")
    if (
        len(q) > 100
        or "\x00" in q
        or named not in ("", "1")
        or con
        and con not in CONSTELLATIONS
    ):
        return render(
            request, "astronomy/index.html", {"error": "查询条件不正确。"}, status=400
        )
    objects = rows()
    total = objects.count()
    if named:
        objects = objects.filter(named_selection__isnull=False)
    if con:
        objects = objects.filter(constellation=con)
    if q:
        term = (
            Q(proper_name__icontains=q)
            | Q(designation__icontains=q)
            | Q(name_zh__icontains=q)
        )
        if q.isdecimal():
            term |= Q(catalogue_id=int(q)) | Q(hip=q) | Q(hd=q)
        objects = objects.filter(term)
    page = Paginator(objects.defer("raw"), 30).get_page(request.GET.get("page"))
    for record in page:
        decorate(record)
    return render(
        request,
        "astronomy/index.html",
        {
            "page": page,
            "total": total,
            "q": q,
            "named": named,
            "con": con,
            "constellations": CONSTELLATIONS.items(),
        },
    )


@never_cache
def detail(request, ident):
    record = decorate(get_object_or_404(rows(), catalogue_id=ident))
    fields = [
        ("赤经", record.ra_hours, "小时，J2000.0"),
        ("赤纬", record.dec_degrees, "度，J2000.0"),
        ("视星等", record.magnitude, "mag"),
        ("绝对星等", record.absolute_magnitude, "mag"),
        ("色指数", record.color_index, "B−V"),
        ("相对光度", record.luminosity_solar, "太阳光度"),
    ]
    return render(
        request, "astronomy/detail.html", {"record": record, "fields": fields}
    )
