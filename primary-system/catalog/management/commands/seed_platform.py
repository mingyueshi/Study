from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.db import transaction
from catalog.models import Stage, Grade, Subject, Module, TextbookEdition, Textbook

MODULES = [
    ('knowledge', '语文知识', 'chinese', 'book', '顺着课文和单元，理解语言的美。'),
    ('math', '数学思维', 'math', 'math', '读知识、看例题，把方法想明白。'),
    ('english', '教材同步单词', 'english', 'english', '按教材册次，积累每天用得到的英语。'),
    ('words', '场景单词', 'english', 'scenes', '从生活场景出发，认识身边的英文。'),
    ('idioms', '成语本', 'chinese', 'idioms', '读懂四个字背后的意思与故事。'),
    ('writing', '作文坊', 'chinese', 'writing', '从好词好句到提纲，让想法变成文字。'),
    ('geo', '地理探索', 'geography', 'globe', '认识地球、山川与我们生活的地方。'),
    ('astro', '天文探索', 'science', 'astro', '从月亮出发，探索更远的宇宙。'),
    ('history', '历史长廊', 'history', 'history', '沿着时间的脚步，认识过去。'),
    ('lit', '文学常识', 'chinese', 'literature', '走近作家、作品和传统文化。'),
    ('sci', '科学实验室', 'science', 'science', '带着问题观察世界，寻找证据。'),
    ('chain', '成语接龙', 'chinese', 'dragon', '统一账号下的接龙玩法正在接入。'),
]


class Command(BaseCommand):
    help = '幂等建立学段、年级、学科、12 个模块及教材目录；不创建用户、不重置已有设置。'

    @transaction.atomic
    def handle(self, *args, **options):
        stage, _ = Stage.objects.get_or_create(code='primary', defaults={'name': '小学'})
        grades = {}
        for number, label in enumerate('一二三四五六', 1):
            grades[number], _ = Grade.objects.get_or_create(code=f'primary-{number}', defaults={
                'name': f'{label}年级', 'stage': stage, 'order': number,
            })
        subjects = {}
        for order, (code, name) in enumerate([
            ('chinese', '语文'), ('math', '数学'), ('english', '英语'),
            ('science', '科学'), ('geography', '地理'), ('history', '历史'),
        ]):
            subjects[code], _ = Subject.objects.get_or_create(code=code, defaults={'name': name, 'order': order})
        for order, (code, name, subject, icon, description) in enumerate(MODULES):
            Module.objects.get_or_create(code=code, defaults={
                'name': name, 'subject': subjects[subject], 'icon': icon, 'description': description, 'order': order,
            })
        for code, name, subject, publisher in [
            ('pep-chinese', '统编版语文', 'chinese', '人民教育出版社'),
            ('bnu-math', '北师大版数学', 'math', '北京师范大学出版社'),
            ('fltrp-english', '外研版新标准英语（三起）', 'english', '外语教学与研究出版社'),
        ]:
            edition, _ = TextbookEdition.objects.get_or_create(code=code, defaults={
                'name': name, 'subject': subjects[subject], 'publisher': publisher,
                'version': '现有 primary 内容标注的新课标版（待按实物教材核对）',
            })
            for term, suffix, label in [('first', 'a', '上册'), ('second', 'b', '下册')]:
                if subject != 'english' and term == 'second':
                    continue
                Textbook.objects.get_or_create(code=f'{code}-4{suffix}-2026', defaults={
                    'name': f'{name} · 四年级{label}', 'edition': edition, 'grade': grades[4],
                    'term': term, 'revision': '2026',
                })
        group, _ = Group.objects.get_or_create(name='内容编辑')
        # Grant catalog editing, never account administration or private progress access.
        permissions = Permission.objects.filter(content_type__app_label='catalog').exclude(codename__startswith='delete_')
        group.permissions.add(*permissions)
        self.stdout.write(self.style.SUCCESS('基础目录与内容编辑权限组已就绪；已有记录保持不变。'))
