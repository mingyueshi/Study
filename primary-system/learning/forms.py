from django import forms
from .models import Progress
from .services import supports_word_marks

class ProgressForm(forms.Form):
    revision = forms.IntegerField(min_value=0, widget=forms.HiddenInput)
    presentation = forms.JSONField(required=False, widget=forms.HiddenInput)
    update_learning = forms.BooleanField(label='明确更新学习状态（确认当前内容）', required=False)
    status = forms.ChoiceField(label='掌握状态', choices=Progress.Status.choices)
    bookmarked = forms.BooleanField(label='收藏这条内容', required=False)
    note = forms.CharField(label='我的笔记', max_length=4000, required=False, widget=forms.Textarea(attrs={'rows': 4, 'placeholder': '记下你的理解或下次想复习的地方…'}))

    def __init__(self, *args, item, **kwargs):
        super().__init__(*args, **kwargs)
        if not supports_word_marks(item):
            self.fields['status'].choices = [(value, label) for value, label in Progress.Status.choices
                                             if value != Progress.Status.TRICKY]
