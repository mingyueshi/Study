from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand
from django.db import transaction
from catalog.models import Stage, Grade, Subject, Module, TextbookEdition, Textbook

MODULES = [
    # 教材内容管线走固定结构的目录编排；专题内容各自成为独立玩法应用（如 chain/words），
    # 以模块卡作为入口，页面由各玩法应用自己渲染。
    ('knowledge', '语文知识', 'chinese', 'book', '顺着课文和单元，理解语言的美。'),
    ('math', '数学思维', 'math', 'math', '读知识、看例题，把方法想明白。'),
    ('english', '教材同步单词', 'english', 'english', '按教材册次，积累每天用得到的英语。'),
    ('chain', '成语接龙', 'chinese', 'dragon', '和小龙陪练轮流接龙，词语取自统一词库。'),
    ('words', '场景单词', 'english', 'scenes', '从生活场景出发，认识身边的英文。'),
]


class Command(BaseCommand):
    help = '幂等建立学段、年级、学科、教材模块与接龙入口；不创建用户、不重置已有设置。'

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
        game_group, _ = Group.objects.get_or_create(name='游戏管理')
        # Full control of the game word pool; still no accounts or private progress.
        game_permissions = Permission.objects.filter(content_type__app_label='chain')
        game_group.permissions.add(*game_permissions)
        self.stdout.write(self.style.SUCCESS('基础目录、内容编辑与游戏管理权限组已就绪；已有记录保持不变。'))
