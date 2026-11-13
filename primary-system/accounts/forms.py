from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import User


class LearnerAuthenticationForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if user.is_staff or user.is_superuser:
            raise forms.ValidationError('管理账号请从管理后台入口登录。', code='admin_login_required')


class LearnerRegistrationForm(forms.ModelForm):
    """快捷注册：用户名 + 密码即可，不收集联系方式、不做任何验证。"""

    password1 = forms.CharField(
        label='设置密码', strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text='给自己一个好记的密码就行，孩子自己能输入最重要。')
    password2 = forms.CharField(
        label='再输一遍密码', strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}))

    class Meta:
        model = User
        fields = ('username',)
        widgets = {'username': forms.TextInput(attrs={'autocomplete': 'username'})}
        help_texts = {'username': '字母、数字或 . @ + - _ ，登录用；创建后不能改。'}

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('两次输入的密码不一致。', code='password_mismatch')
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        # 自助注册只创建普通学习账号；特权字段永远不接受表单输入。
        user.is_active = True
        user.is_staff = False
        user.is_superuser = False
        if commit:
            user.save()
        return user


class ProfileForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['grade'].empty_label = '暂不设置年级'

    class Meta:
        model = User
        fields = ('display_name', 'grade')
        help_texts = {
            'display_name': '学习时显示这个名字，不填就用登录用户名。',
            'grade': '可以先不选，以后再来调整。',
        }
