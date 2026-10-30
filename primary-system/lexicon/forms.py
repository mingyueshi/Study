from django import forms
from .models import Sense, Pronunciation


class RevisionForm(forms.ModelForm):
    expected_revision = forms.IntegerField(widget=forms.HiddenInput)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['expected_revision'].initial = self.instance.revision

    def clean(self):
        data = super().clean()
        if data.get('expected_revision') != type(self.instance).objects.get(pk=self.instance.pk).revision:
            raise forms.ValidationError('记录已更新，请重新打开页面。')
        if not data.get('editorial_note', '').strip():
            raise forms.ValidationError('请填写修订说明；清空修订恢复来源释义时同样需要说明。')
        return data


class SenseForm(RevisionForm):
    class Meta:
        model = Sense
        fields = ('editorial_definition', 'editorial_note')


class PronunciationForm(RevisionForm):
    class Meta:
        model = Pronunciation
        fields = ('editorial_value', 'editorial_note')
