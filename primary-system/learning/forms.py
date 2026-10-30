from django import forms
from .models import Progress

class ProgressForm(forms.Form):
    revision = forms.IntegerField(min_value=0, widget=forms.HiddenInput)
    status = forms.ChoiceField(label='掌握状态', choices=Progress.Status.choices)
    bookmarked = forms.BooleanField(label='收藏这条内容', required=False)
    note = forms.CharField(label='我的笔记', max_length=4000, required=False, widget=forms.Textarea(attrs={'rows': 4, 'placeholder': '记下你的理解或下次想复习的地方…'}))
