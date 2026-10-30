from django.contrib import admin
from django.urls import path, include
from nova_admin.slider import SliderCaptchaAdminAuthenticationForm
admin.site.login_form=SliderCaptchaAdminAuthenticationForm
admin.site.login_template="nova_admin/slider_login.html"
from game import views
urlpatterns=[path('api/idioms/',views.idiom_search),path('api/idioms/lookup/',views.idiom_lookup),path('api/idioms/<int:pk>/',views.idiom_detail),path('',views.index),path('api/state/',views.state),path('api/play/',views.play),path('api/hint/',views.hint),path('api/restart/',views.restart),path('admin/_slider/',include('nova_slider_captcha.urls')),path('admin/',admin.site.urls)]
