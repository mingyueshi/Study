from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from .forms import LearnerRegistrationForm, ProfileForm


def _safe_next(request, default='/'):
    candidate = request.POST.get('next') or request.GET.get('next')
    if candidate and url_has_allowed_host_and_scheme(candidate, allowed_hosts={request.get_host()},
                                                     require_https=request.is_secure()):
        return candidate
    return default


@never_cache
@require_http_methods(['GET', 'POST'])
def register(request):
    if request.user.is_authenticated:
        return redirect('profile')
    form = LearnerRegistrationForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        user = form.save()
        login(request, user)  # 快捷注册：建号即登录，不收集联系方式、不做验证。
        messages.success(request, f'欢迎你，{user.display_name or user.username}！账号已经准备好。')
        return HttpResponseRedirect(_safe_next(request))
    return render(request, 'accounts/register.html', {'form': form})


@never_cache
@login_required
@require_http_methods(['GET', 'POST'])
def profile(request):
    form = ProfileForm(request.POST if request.method == 'POST' else None, instance=request.user)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, '学习偏好已保存。')
        return redirect('profile')
    return render(request, 'accounts/profile.html', {'form': form})
