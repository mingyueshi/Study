from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.password_validation import validate_password
from .models import User


class LearnerAuthenticationForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if user.is_staff or user.is_superuser:
            raise forms.ValidationError('管理账号请从管理后台入口登录。', code='admin_login_required')


class LearnerRegistrationForm(forms.ModelForm):
    """快捷注册：用户名 + 密码即可，不收集联系方式、不做任何验证。"""

    display_name = forms.CharField(
        label='显示名称（选填）', max_length=50, required=False, strip=True,
        help_text='页面上展示的名字，之后可在我的学习里修改。')
    password1 = forms.CharField(
        label='设置密码', strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text='至少 8 位，不要用生日或 123456 这类简单密码。')
    password2 = forms.CharField(
        label='再输一遍密码', strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}))

    class Meta:
        model = User
        fields = ('username', 'display_name')
        help_texts = {'username': '字母、数字或 . @ + - _ ，登录用；创建后不能改。'}

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('两次输入的密码不一致。', code='password_mismatch')
        if password2:
            validate_password(password2, User(username=self.cleaned_data.get('username') or ''))
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
    class Meta:
        model = User
        fields = ('display_name', 'grade')
