"""接龙对局 API：服务端权威，revision 乐观锁，409 时客户端重拉状态。

登录玩家对局挂账号；游客免登录直接玩，对局挂浏览器会话键（会话过期即失效）。
"""
import json
import secrets

from django.db import OperationalError
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


def _payload(request, round, *, hint=None):
    payload = {
        'id': str(round.pk), 'revision': round.revision, 'score': round.score, 'hints': round.hints,
        'chain': round.chain, 'status': round.status, 'ended_reason': round.get_ended_reason_display() if round.ended_reason else '',
        'next_char': round.chain[-1]['last_char'] if round.status == GameRound.Status.PLAYING else '',
        **services.pool_stats(),
        'history': [{'score': item.score, 'hints': item.hints, 'length': len(item.chain) - 1,
                     'ended_reason': item.get_ended_reason_display() or '手动重开',
                     'finished_at': item.finished_at.strftime('%Y-%m-%d %H:%M')} for item in services.round_history(_owner(request))],
    }
    if hint:
        payload['hint'] = hint
    return payload


@never_cache
@require_GET
def page(request):
    round = services.current_round(_owner(request), exclude_headword=request.session.get('chain_last_starter'))
    request.session['chain_last_starter'] = round.chain[0]['word']
    return render(request, 'chain/play.html', {'state': _payload(request, round)})


@never_cache
@require_GET
def state(request):
    round = services.current_round(_owner(request), exclude_headword=request.session.get('chain_last_starter'))
    request.session['chain_last_starter'] = round.chain[0]['word']
    return JsonResponse(_payload(request, round))


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
        if action == 'play':
            round, hint = services.play(owner, data['round_id'], data['revision'], data.get('word', '')), None
        elif action == 'hint':
            round, hint = services.take_hint(owner, data['round_id'], data['revision'])
        else:
            finished = services.restart_round(owner, data['round_id'], data['revision'])
            hint = None
            request.session['chain_last_starter'] = finished.chain[0]['word']
            round = services.current_round(owner, exclude_headword=finished.chain[0]['word'])
            request.session['chain_last_starter'] = round.chain[0]['word']
    except services.ChainConflict as exc:
        return JsonResponse({'error': str(exc)}, status=409)
    except services.ChainError as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    except OperationalError:
        return JsonResponse({'error': '数据库暂忙，请重新读取状态后再操作。'}, status=503)
    return JsonResponse(_payload(request, round, hint=hint))


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
