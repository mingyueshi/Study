from django import forms
from .models import Grade, Subject, TextbookEdition

class CatalogFilter(forms.Form):
    grade = forms.ModelChoiceField(label='年级', queryset=Grade.objects.all(), to_field_name='code', required=False, empty_label='全部年级')
    subject = forms.ModelChoiceField(label='学科', queryset=Subject.objects.all(), to_field_name='code', required=False, empty_label='全部学科')
    edition = forms.ModelChoiceField(label='教材版本', queryset=TextbookEdition.objects.all(), to_field_name='code', required=False, empty_label='全部教材 / 专题')
    q = forms.CharField(label='搜索', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': '搜索学习册或知识点'}))
