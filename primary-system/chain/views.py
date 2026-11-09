"""接龙对局 API：服务端权威，revision 乐观锁，409 时客户端重拉状态。

登录玩家对局挂账号；游客免登录直接玩，对局挂浏览器会话键（会话过期即失效）。
"""
import json
import secrets

from django.db import OperationalError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST

from . import services
from .models import GameRound

MAX_BODY = 32000
GUEST_KEY = 'chain_guest'


def _owner(request):
    """归属过滤：登录玩家按账号，游客按会话内随机键。"""
    if request.user.is_authenticated:
        return {'user': request.user}
    if not request.session.session_key:
        request.session.create()
    key = request.session.get(GUEST_KEY)
    if not key:
        key = secrets.token_hex(16)
        request.session[GUEST_KEY] = key
    return {'guest_key': key}


def _history(request):
    return [{'score': item.score, 'p2_score': item.p2_score, 'mode': item.mode,
             'hints': item.hints, 'length': len(item.chain) - 1,
             'ended_reason': item.get_ended_reason_display() or '手动重开',
             'finished_at': item.finished_at.strftime('%Y-%m-%d %H:%M')}
            for item in services.round_history(_owner(request))]


def _payload(request, round, *, pool, hint=None):
    payload = {
        'id': str(round.pk), 'revision': round.revision, 'score': round.score,
        'p2_score': round.p2_score, 'hints': round.hints,
        'mode': round.mode, 'first_player': round.first_player,
        'chain': round.chain, 'status': round.status,
        'ended_reason': round.get_ended_reason_display() if round.ended_reason else '',
        'next_char': round.chain[-1]['last_char'] if round.status == GameRound.Status.PLAYING else '',
        **services.pool_stats(pool),
        'history': _history(request),
    }
    if round.mode == GameRound.Mode.DUEL and round.status == GameRound.Status.PLAYING:
        payload['turn'] = services.duel_turn(round)
    if hint:
        payload['hint'] = hint
    return payload


def _needs_start(request, *, pool):
    """家长对决尚无进行中局：先选这一局谁先接，再开局。"""
    return {'mode': GameRound.Mode.DUEL, 'status': 'needs_start',
            'id': '', 'revision': 0, 'score': 0, 'p2_score': 0, 'hints': 0,
            'first_player': '', 'chain': [], 'next_char': '', 'ended_reason': '',
            **services.pool_stats(pool), 'history': _history(request)}


def _state_round(request, pool):
    """按 ?mode= 取当前对局；duel 没有进行中局时返回 None（进入先手选择）。"""
    mode = GameRound.Mode.DUEL if request.GET.get('mode') == GameRound.Mode.DUEL else GameRound.Mode.SOLO
    return services.current_round(_owner(request), mode=mode,
                                  exclude_headword=request.session.get('chain_last_starter'), pool=pool)


@ensure_csrf_cookie
@never_cache
@require_GET
def page(request):
    try:
        pool = services.chain_pool()
        round = _state_round(request, pool)
    except services.ChainError:
        return render(request, 'chain/unavailable.html')
    if round is None:
        return render(request, 'chain/play.html', {'state': _needs_start(request, pool=pool)})
    request.session['chain_last_starter'] = round.chain[0]['word']
    return render(request, 'chain/play.html', {'state': _payload(request, round, pool=pool)})


@never_cache
@require_GET
def state(request):
    try:
        pool = services.chain_pool()
        round = _state_round(request, pool)
    except services.ChainError:
        return JsonResponse({'error': '暂时没有可用成语，请稍后再来。', 'status': 'unavailable'}, status=503)
    if round is None:
        return JsonResponse(_needs_start(request, pool=pool))
    request.session['chain_last_starter'] = round.chain[0]['word']
    return JsonResponse(_payload(request, round, pool=pool))


def _body(request):
    if len(request.body) > MAX_BODY:
        raise services.ChainError('请求过大。')
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        raise services.ChainError('请求格式不正确。')
    if not isinstance(data, dict) or not isinstance(data.get('round_id'), str) \
            or type(data.get('revision')) is not int or (data.get('word') is not None and not isinstance(data.get('word'), str)):
        raise services.ChainError('请求格式不正确。')
    return data


def _mutate(request, action):
    owner = _owner(request)
    try:
        data = _body(request)
        pool = services.chain_pool()
        if action == 'play':
            round, hint = services.play(owner, data['round_id'], data['revision'], data.get('word', ''), pool=pool), None
            if round.status == services.GameRound.Status.FINISHED and round.ended_reason:
                # 真实终局（有人接不上）才记激励；中途重开旧局不算。
                from incentives.services import record_event
                record_event(request.user, 'chain_round_finished', request=request)
        elif action == 'hint':
            round, hint = services.take_hint(owner, data['round_id'], data['revision'], pool=pool)
        else:
            finished = services.restart_round(owner, data['round_id'], data['revision'])
            hint = None
            request.session['chain_last_starter'] = finished.chain[0]['word']
            round = services.current_round(owner, exclude_headword=finished.chain[0]['word'], pool=pool)
            request.session['chain_last_starter'] = round.chain[0]['word']
    except services.ChainConflict as exc:
        return JsonResponse({'error': str(exc)}, status=409)
    except services.ChainError as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重新读取状态后再操作。'}, status=503)
    payload = _payload(request, round, pool=pool, hint=hint)
    if request.user.is_authenticated:
        from incentives.services import take_awards
        rewards = take_awards(request)
        if rewards:
            payload['rewards'] = rewards
    return JsonResponse(payload)


@never_cache
@require_POST
def play(request):
    return _mutate(request, 'play')


@never_cache
@require_POST
def hint(request):
    return _mutate(request, 'hint')


@never_cache
@require_POST
def restart(request):
    return _mutate(request, 'restart')


def _start_body(request):
    """开局请求只带 first_player；进行中旧局（若有）由服务端自己找并结束。"""
    if len(request.body) > MAX_BODY:
        raise services.ChainError('请求过大。')
    try:
        data = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        raise services.ChainError('请求格式不正确。') from None
    if not isinstance(data, dict) or data.get('first_player') not in (GameRound.FirstPlayer.P1, GameRound.FirstPlayer.P2):
        raise services.ChainError('请先选择这一局谁先接。')
    return data


@never_cache
@require_POST
def start(request):
    """家长对决开局/重开：每局都重新选先手。"""
    owner = _owner(request)
    try:
        data = _start_body(request)
        pool = services.chain_pool()
        playing = GameRound.objects.filter(**owner, status=GameRound.Status.PLAYING,
                                           mode=GameRound.Mode.DUEL).first()
        if playing:
            services.restart_round(owner, str(playing.pk), playing.revision)
        exclude = playing.chain[0]['word'] if playing else request.session.get('chain_last_starter')
        round = services.start_round(owner, mode=GameRound.Mode.DUEL, first_player=data['first_player'],
                                     exclude_headword=exclude, pool=pool)
    except services.ChainConflict as exc:
        return JsonResponse({'error': str(exc)}, status=409)
    except services.ChainError as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重新读取状态后再操作。'}, status=503)
    request.session['chain_last_starter'] = round.chain[0]['word']
    return JsonResponse(_payload(request, round, pool=pool))
