"""接龙对局 API：服务端权威，revision 乐观锁，409 时客户端重拉状态。"""
import json

from django.contrib.auth.decorators import login_required
from django.db import OperationalError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST

from . import services
from .models import GameRound

MAX_BODY = 32000


def _payload(request, round, *, hint=None):
    payload = {
        'id': str(round.pk), 'revision': round.revision, 'score': round.score, 'hints': round.hints,
        'chain': round.chain, 'status': round.status, 'ended_reason': round.get_ended_reason_display() if round.ended_reason else '',
        'next_char': round.chain[-1]['last_char'] if round.status == GameRound.Status.PLAYING else '',
        **services.pool_stats(),
        'history': [{'score': item.score, 'hints': item.hints, 'length': len(item.chain) - 1,
                     'ended_reason': item.get_ended_reason_display() or '手动重开',
                     'finished_at': item.finished_at.strftime('%Y-%m-%d %H:%M')} for item in services.round_history(request.user)],
    }
    if hint:
        payload['hint'] = hint
    return payload


@login_required
@never_cache
@require_GET
def page(request):
    round = services.current_round(request.user, exclude_headword=request.session.get('chain_last_starter'))
    request.session['chain_last_starter'] = round.chain[0]['word']
    return render(request, 'games/play.html', {'state': _payload(request, round)})


def _login_gate(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': '请先登录后开始接龙。'}, status=401)
    return None


@never_cache
@require_GET
def state(request):
    blocked = _login_gate(request)
    if blocked:
        return blocked
    round = services.current_round(request.user, exclude_headword=request.session.get('chain_last_starter'))
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
    blocked = _login_gate(request)
    if blocked:
        return blocked
    try:
        data = _body(request)
        if action == 'play':
            round, hint = services.play(request.user, data['round_id'], data['revision'], data.get('word', '')), None
        elif action == 'hint':
            round, hint = services.take_hint(request.user, data['round_id'], data['revision'])
        else:
            finished = services.restart_round(request.user, data['round_id'], data['revision'])
            hint = None
            request.session['chain_last_starter'] = finished.chain[0]['word']
            round = services.current_round(request.user, exclude_headword=finished.chain[0]['word'])
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
