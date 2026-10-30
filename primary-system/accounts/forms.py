from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import User


class LearnerAuthenticationForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if user.is_staff or user.is_superuser:
            raise forms.ValidationError('管理账号请从管理后台入口登录。', code='admin_login_required')

class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('display_name', 'grade')
