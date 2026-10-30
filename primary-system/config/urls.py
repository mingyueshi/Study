from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from django.views.generic.base import RedirectView
from nova_admin.slider import SliderCaptchaAdminAuthenticationForm
from accounts.views import profile
from accounts.forms import LearnerAuthenticationForm
from catalog import views as catalog
from learning import views as learning
from lexicon import views as lexicon
from lexicon import pages as dictionary

admin.site.site_header = '乐学堂 · 学习管理'
admin.site.site_title = '乐学堂后台'
admin.site.index_title = '内容、教材与账号'
admin.site.login_form = SliderCaptchaAdminAuthenticationForm
admin.site.login_template = 'nova_admin/slider_login.html'

urlpatterns = [
    path('favicon.ico', RedirectView.as_view(url='/static/icons/book.svg', permanent=False)),
    path('', catalog.home, name='home'),
    path('dictionary/', dictionary.lookup, name='dictionary'),
    path('dictionary/sources/', dictionary.sources, name='dictionary-sources'),
    path('dictionary/<uuid:pk>/', dictionary.detail, name='dictionary-entry'),
    path('modules/<slug:code>/', catalog.module_detail, name='module'),
    path('books/<slug:code>/', catalog.collection_detail, name='collection'),
    path('items/<uuid:pk>/', learning.item_detail, name='item'),
    path('me/', learning.my_learning, name='my-learning'),
    path('accounts/profile/', profile, name='profile'),
    path('accounts/login/', auth_views.LoginView.as_view(template_name='accounts/login.html', authentication_form=LearnerAuthenticationForm), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('accounts/password/', auth_views.PasswordChangeView.as_view(template_name='accounts/password.html'), name='password_change'),
    path('accounts/password/done/', auth_views.PasswordChangeDoneView.as_view(template_name='accounts/password_done.html'), name='password_change_done'),
    path('api/v1/catalog/', catalog.catalog_api),
    path('api/v1/items/', catalog.items_api),
    path('api/v1/items/<uuid:pk>/', catalog.item_api),
    path('api/v1/items/<uuid:pk>/lexicon/', lexicon.content_links),
    path('api/v1/lexicon/', lexicon.entries),
    path('api/v1/lexicon/<uuid:pk>/', lexicon.entry_detail, name='lexicon-detail'),
    path('api/v1/me/progress/<uuid:pk>/', learning.progress_api),
    path('admin/_slider/', include('nova_slider_captcha.urls')),
    path('admin/', admin.site.urls),
]
