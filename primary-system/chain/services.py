"""接龙取词与对局：只消费词库生效版本，不要求公开准入（评审定的边界）。

规则沿用 idiom-chain：四字成语、严格同字接龙（不谐音）、+10/−5 计分、
revision 乐观锁；终局采用原型的自动判定——待接一方无候选即结束。
陪练移植原型的 depth-3 前瞻：在延续最深的候选中随机应对。
"""
import random

from django.contrib.auth import get_user_model

# 陪练与开局的随机仅影响玩法，不承担安全职责；系统级随机消除可预测性争议。
SYSTEM_RANDOM = random.SystemRandom()
from django.db import transaction
from django.db.models import Count, Max
from django.utils import timezone
from lexicon.models import active_records

from .models import ChainWord, GameRound

LOOKAHEAD = 3
# 陪练前瞻的节点预算：达到即停止加深，保证单步响应有界。
_NODE_BUDGET = 20000


class ChainError(Exception):
    """对局规则错误；message 面向玩家展示。"""


class ChainConflict(ChainError):
    """对局已被其他页面更新或不存在，客户端应重新拉取状态。"""


def eligible_chain_records():
    """可接龙的生效来源记录：生效版本 + 启用来源 + 词池开启，不看 public_allowed。"""
    return active_records().filter(
        binding__sense__entry__kind='idiom',
        binding__sense__entry__chain_word__game_eligible=True,
    ).select_related('binding__sense__entry')


# ---- 内存词池：候选检查与陪练前瞻不再逐次查库 ----

_POOL_CACHE = {'key': None, 'rows': None}


def chain_pool():
    """[(entry_id, headword, first_char, last_char)]，主键统一为字符串。

    缓存键取词池行数与最新更新时间；后台增删或勾选后自动失效。
    """
    agg = ChainWord.objects.filter(game_eligible=True).aggregate(n=Count('pk'), latest=Max('updated_at'))
    key = (agg['n'], agg['latest'])
    if _POOL_CACHE['key'] != key or _POOL_CACHE['rows'] is None:
        rows = list(ChainWord.objects.filter(game_eligible=True).select_related('entry').values_list(
            'entry_id', 'entry__headword', 'first_char', 'last_char'))
        _POOL_CACHE['key'] = key
        _POOL_CACHE['rows'] = [(str(entry_id), headword, first, last) for entry_id, headword, first, last in rows]
    return _POOL_CACHE['rows']


def _by_first(rows):
    index = {}
    for row in rows:
        index.setdefault(row[2], []).append(row)
    return index


def _unused_candidates(index, tail, used_ids):
    return [row for row in index.get(tail, ()) if row[0] not in used_ids]


def _depth(index, rows, used_ids, remaining, budget):
    """原型前瞻启发式：该候选之后还能接多深（有界，达上限或预算即止）。"""
    best = 0
    for row in rows:
        if best >= remaining or budget[0] <= 0:
            break
        budget[0] -= 1
        child_used = used_ids | {row[0]}
        children = _unused_candidates(index, row[3], child_used)
        best = max(best, 1 + _depth(index, children, child_used, remaining - 1, budget))
    return best


def _ranked(index, tail, used_ids):
    """候选按延续深度降序 [(depth, row)]，同深度保持词池顺序。"""
    budget = [_NODE_BUDGET]
    ranked = []
    for row in _unused_candidates(index, tail, used_ids):
        child_used = used_ids | {row[0]}
        depth = 1 + _depth(index, _unused_candidates(index, row[3], child_used), child_used, LOOKAHEAD - 1, budget)
        ranked.append((depth, row))
    ranked.sort(key=lambda item: -item[0])
    return ranked


def partner_reply(index, tail, used_ids):
    """陪练选词：延续最深的候选中随机；无候选返回 None（本局结束）。"""
    ranked = _ranked(index, tail, used_ids)
    if not ranked:
        return None
    top_depth = ranked[0][0]
    best = [row for depth, row in ranked if depth == top_depth]
    return SYSTEM_RANDOM.choice(best)


def hint_candidates(index, tail, used_ids):
    """全部可接候选，按延续深度降序；提示面板整列展示。"""
    return [row for _, row in _ranked(index, tail, used_ids)]


# ---- 链卡展示信息 ----

def chain_entry_info(entry_ids):
    """按来源优先级取每个词条的展示信息：词头、已核读音、义项释义（人工修订优先）。"""
    records = (active_records().filter(binding__sense__entry_id__in=list(entry_ids))
               .select_related('binding__sense__entry', 'binding__pronunciation')
               .order_by('release__source__priority', 'binding__external_key'))
    info = {}
    for record in records:
        entry = record.binding.sense.entry
        key = str(entry.pk)
        if key in info:
            continue
        pronunciation = record.binding.pronunciation
        pinyin = ''
        if pronunciation and pronunciation.is_reviewed:
            pinyin = pronunciation.editorial_value or record.pronunciation_value
        meaning = record.binding.sense.editorial_definition.strip() or record.definition.strip()
        info[key] = {'word': entry.headword, 'pinyin': pinyin, 'meaning': '' if meaning == '无' else meaning}
    return info


def _chain_item(row, info, by):
    return {'entry_id': row[0], 'word': row[1], 'pinyin': info['pinyin'], 'meaning': info['meaning'],
            'by': by, 'last_char': row[3]}


# ---- 对局流程 ----
# owner 是归属过滤字典：登录玩家 {'user': <User>}，游客 {'guest_key': <会话键>}。


@transaction.atomic
def current_round(owner, *, exclude_headword=None):
    """返回进行中的对局；没有则开新局（原子内重查，避免并发重复开局）。"""
    round = GameRound.objects.select_for_update().filter(
        **owner, status=GameRound.Status.PLAYING).order_by('-updated_at').first()
    if round is not None:
        return round
    return start_round(owner, exclude_headword=exclude_headword)


def start_round(owner, *, exclude_headword=None):
    pool = chain_pool()
    if not pool:
        raise ChainError('接龙词池还是空的，请先在后台填充词池。')
    index = _by_first(pool)
    starters = [row for row in pool if _unused_candidates(index, row[3], {row[0]})]
    starters = [row for row in starters if row[1] != exclude_headword] or starters or pool
    row = SYSTEM_RANDOM.choice(starters)
    info = chain_entry_info([row[0]]).get(row[0], {'word': row[1], 'pinyin': '', 'meaning': ''})
    return GameRound.objects.create(**owner, chain=[_chain_item(row, info, 'start')])


@transaction.atomic
def restart_round(owner, round_id, revision):
    round = _locked_round(owner, round_id, revision)
    if round.status == GameRound.Status.PLAYING:
        round.status = GameRound.Status.FINISHED
        round.ended_reason = ''
        round.finished_at = timezone.now()
        round.revision += 1
        round.save()
    return round


@transaction.atomic
def play(owner, round_id, revision, word):
    word = (word or '').strip()
    round = _locked_round(owner, round_id, revision, expect_playing=True)
    if len(word) != 4 or not all('\u3400' <= char <= '\u9fff' for char in word):
        raise ChainError('请输入四字成语。')
    if any(item['word'] == word for item in round.chain):
        raise ChainError('这个成语已经用过了，换一个吧。')
    pool = chain_pool()
    row = next((candidate for candidate in pool if candidate[1] == word), None)
    if row is None:
        raise ChainError('未收录这个成语，请尝试词库中的其他成语。')
    previous = round.chain[-1]
    if row[2] != previous['last_char']:
        raise ChainError(f'请以“{previous["last_char"]}”字开头，不使用谐音。')

    info = chain_entry_info([row[0]]).get(row[0], {'word': word, 'pinyin': '', 'meaning': ''})
    round.chain.append(_chain_item(row, info, 'player'))
    round.score += 10

    index = _by_first(pool)
    used_ids = {item['entry_id'] for item in round.chain}
    reply = partner_reply(index, row[3], used_ids)
    if reply is None:
        round.status = GameRound.Status.FINISHED
        round.ended_reason = GameRound.EndedReason.PARTNER_STUCK
        round.finished_at = timezone.now()
    else:
        reply_info = chain_entry_info([reply[0]]).get(reply[0], {'word': reply[1], 'pinyin': '', 'meaning': ''})
        round.chain.append(_chain_item(reply, reply_info, 'partner'))
        if not _unused_candidates(index, reply[3], {item['entry_id'] for item in round.chain}):
            round.status = GameRound.Status.FINISHED
            round.ended_reason = GameRound.EndedReason.PLAYER_STUCK
            round.finished_at = timezone.now()
    round.revision += 1
    round.save()
    return round


@transaction.atomic
def take_hint(owner, round_id, revision):
    round = _locked_round(owner, round_id, revision, expect_playing=True)
    index = _by_first(chain_pool())
    used_ids = {item['entry_id'] for item in round.chain}
    candidates = hint_candidates(index, round.chain[-1]['last_char'], used_ids)
    if not candidates:
        raise ChainError('当前词池没有可接的成语，本局已走到尽头；可以重新开始。')
    infos = chain_entry_info([row[0] for row in candidates])
    hints = [{'entry_id': row[0], 'word': row[1],
              'pinyin': infos.get(row[0], {}).get('pinyin', ''), 'meaning': infos.get(row[0], {}).get('meaning', '')}
             for row in candidates]  # 全部可接候选，前端整列滚动展示。
    round.score = max(0, round.score - 5)
    round.hints += 1
    round.revision += 1
    round.save()
    return round, hints


def _locked_round(owner, round_id, revision, *, expect_playing=False):
    if 'user' in owner:
        # 账号对局用账号行锁串行化首写；游客没有可锁行，同浏览器请求本身是串行的。
        get_user_model().objects.select_for_update().get(pk=owner['user'].pk)
    round = GameRound.objects.select_for_update().filter(pk=round_id, **owner).first()
    if round is None:
        raise ChainConflict('对局不存在或已重开，请刷新后重试。')
    if expect_playing and round.status != GameRound.Status.PLAYING:
        raise ChainError('本局已结束，请重新开始。')
    if revision != round.revision:
        raise ChainConflict('对局已更新，请刷新后再试。')
    return round


def round_history(owner, limit=5):
    return list(GameRound.objects.filter(**owner, status=GameRound.Status.FINISHED)
                .order_by('-finished_at')[:limit])


def pool_stats():
    rows = chain_pool()
    if not rows:
        return {'pool_count': 0, 'chars': 0}
    index = _by_first(rows)
    return {'pool_count': len(rows), 'chars': len(index)}
