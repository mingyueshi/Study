from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import include, path
from django.views.generic.base import RedirectView
from nova_admin.slider import SliderCaptchaAdminAuthenticationForm
from nova_admin.urls import for_admin
from accounts import views as accounts_views
from accounts.forms import LearnerAuthenticationForm
from catalog import views as catalog
from catalog.energy_environment import energy_environment
from catalog.great_works import great_works
from catalog.mathematicians import mathematicians
from catalog.money_trade import money_trade
from catalog.time_story import time_story
from catalog.upgrade_views import upgrade_history
from catalog.study_courses import computing_lab, food_journey, hanzi_evolution, literature_study, probability_lab
from chinesebook import couplets, punctuation, rhetoric, word_maze
from learning import views as learning
from lexicon import views as lexicon
from lexicon import pages as dictionary
from config.health import health

admin.site.site_header = '乐学堂 · 学习管理'
admin.site.site_title = '乐学堂后台'
admin.site.index_title = '学习数据总览'
admin.site.login_form = SliderCaptchaAdminAuthenticationForm
admin.site.login_template = 'nova_admin/slider_login.html'

urlpatterns = [
    path('healthz/', health, name='health'),
    path('favicon.ico', RedirectView.as_view(url='/static/icons/book.svg', permanent=False)),
    path('', catalog.home, name='home'),
    path('interdisciplinary/time-story/', time_story, name='time-story'),
    path('interdisciplinary/great-works/', great_works, name='great-works'),
    path('interdisciplinary/great-works/<slug:work_id>/', great_works, name='great-work-detail'),
    path('interdisciplinary/money-trade/', money_trade, name='money-trade'),
    path('interdisciplinary/energy-environment/', energy_environment, name='energy-environment'),
    path('interdisciplinary/food/', food_journey, name='food-journey'),
    path('updates/', upgrade_history, name='upgrade-history'),
    path('references/', include('reference_library.urls')),
    path('references/lexicon/', include('lexicon.reference_urls')),
    path('hanzi/', include('hanzi.urls')),
    path('poetry/', include('poetry.urls')),
    path('history/', include('historystudy.urls')),
    path('geography/', include('geographystudy.urls')),
    path('geography/', include('geography.urls')),
    path('astronomy/', include('astronomy.urls')),
    path('literature/', literature_study, name='literature-study'),
    path('classical/', include('classical.urls')),
    path('couplets/', couplets.workshop, name='couplets'),
    path('punctuation/', punctuation.laboratory, name='punctuation-lab'),
    path('rhetoric/', rhetoric.gallery, name='rhetoric-gallery'),
    path('word-maze/', word_maze.maze, name='word-maze'),
    path('hanzi-evolution/', hanzi_evolution, name='hanzi-evolution'),
    path('probability/', probability_lab, name='probability-lab'),
    path('computing/', computing_lab, name='computing-lab'),
    path('science/', include('science.urls')),
    path('dictionary/', dictionary.lookup, name='dictionary'),
    path('dictionary/sources/', dictionary.sources, name='dictionary-sources'),
    path('dictionary/<uuid:pk>/', dictionary.detail, name='dictionary-entry'),
    path('modules/<slug:code>/', catalog.module_detail, name='module'),
    path('books/<slug:code>/', catalog.collection_detail, name='collection'),
    path('items/<uuid:pk>/', learning.item_detail, name='item'),
    path('me/', learning.my_learning, name='my-learning'),
    path('chain/', include('chain.urls')),
    path('words/', include('words.urls')),
    path('idioms/', include('idioms.urls')),
    path('phonetics/', include('phonetics.urls')),
    path('writing/', include('writing.urls')),
    path('questionbank/', include('questionbank.urls')),
    path('grammar/', include('grammar.urls')),
    path('plurals/', include('plurals.urls')),
    path('phrases/', include('phrases.urls')),
    path('mathbook/', include('mathbook.urls')),
    path('chinesebook/', include('chinesebook.urls')),
    path('mathformulas/', include('mathformulas.urls')),
    path('mathbeauty/', include('mathbeauty.urls')),
    path('math-stories/', mathematicians, name='math-stories'),
    path('math-stories/<slug:person_id>/', mathematicians, name='math-story-person'),
    path('mathcamp/', include('mathcamp.urls')),
    path('measurement/', include('measurement.urls')),
    path('mysteries/', include('mysteries.urls')),
    path('human-origins/', include('humanorigins.urls')),
    path('rewards/', include('incentives.urls')),
    path('accounts/profile/', accounts_views.profile, name='profile'),
    path('accounts/register/', accounts_views.register, name='register'),
    path('accounts/login/', auth_views.LoginView.as_view(template_name='accounts/login.html', authentication_form=LearnerAuthenticationForm), name='login'),
    path('accounts/logout/', accounts_views.LearnerLogoutView.as_view(), name='logout'),
    path('accounts/password/', auth_views.PasswordChangeView.as_view(template_name='accounts/password.html'), name='password_change'),
    path('accounts/password/done/', auth_views.PasswordChangeDoneView.as_view(template_name='accounts/password_done.html'), name='password_change_done'),
    path('api/v1/catalog/', catalog.catalog_api),
    path('api/v1/items/', catalog.items_api),
    path('api/v1/items/<uuid:pk>/', catalog.item_api),
    path('api/v1/items/<uuid:pk>/lexicon/', lexicon.content_links),
    path('api/v1/lexicon/', lexicon.entries),
    path('api/v1/lexicon/<uuid:pk>/', lexicon.entry_detail, name='lexicon-detail'),
    path('api/v1/me/progress/<uuid:pk>/', learning.progress_api, name='progress-api'),
    path('admin/_slider/', include('nova_slider_captcha.urls')),
    path('admin/_nova/', include(for_admin(admin.site))),
    path('admin/', admin.site.urls),
]
