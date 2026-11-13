from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from incentives.models import RewardItem
from incentives.categories import LEGACY_CATEGORY_ALIASES
from incentives.reward_catalog import DEFAULT_SOURCE, load_reward_catalog


class Command(BaseCommand):
    help = '导入兑换奖励目录：默认只补缺，可选择下架未修改的旧目录，保留家长设置与兑换历史。'

    def add_arguments(self, parser):
        parser.add_argument('--source', default=str(DEFAULT_SOURCE), help='奖励目录 JSON 路径。')
        parser.add_argument('--dry-run', action='store_true', help='校验并列出待新增项目，不写数据库。')
        parser.add_argument('--retire-source', help='旧目录 JSON：仅下架内容与排序均未修改的旧项目，保留兑换历史。')

    def handle(self, *args, **options):
        try:
            rows = load_reward_catalog(options['source'])
            retired = load_reward_catalog(options['retire_source'], for_retirement=True) if options.get('retire_source') else []
            if {row['name'] for row in rows} & {row['name'] for row in retired}:
                raise ValueError('新旧目录不能包含同名项目，避免下架当前奖励。')
        except (OSError, ValueError) as error:
            raise CommandError(f'奖励目录校验失败：{error}') from error
        with transaction.atomic():
            names = set(RewardItem.objects.filter(name__in=[row['name'] for row in rows]).values_list('name', flat=True))
            missing = [RewardItem(**row, sort=index * 10) for index, row in enumerate(rows, 1) if row['name'] not in names]
            category_updates = [(row['name'], row['category']) for row in rows if row.get('category') and RewardItem.objects.filter(name=row['name'], category='').exists()]
            retire_ids = []
            for index, row in enumerate(retired, 1):
                expected = {'category': '', **row}
                sort = expected.pop('sort', index * 10)
                retire_ids.extend(RewardItem.objects.filter(**expected, sort=sort, is_active=True).values_list('pk', flat=True))
            merge_ids = list(RewardItem.objects.filter(category__in=LEGACY_CATEGORY_ALIASES).values_list('pk', flat=True)) if any(row.get('category') == 'entertainment' for row in rows) else []
            if not options['dry_run']:
                RewardItem.objects.bulk_create(missing)
                for name, category in category_updates:
                    RewardItem.objects.filter(name=name, category='').update(category=category)
                RewardItem.objects.filter(pk__in=merge_ids).update(category='entertainment')
                RewardItem.objects.filter(pk__in=retire_ids).update(is_active=False)
        for item in missing:
            self.stdout.write(f'{item.cost} 积分 · {item.name}')
        action = '预览：将新增' if options['dry_run'] else '已新增'
        self.stdout.write(self.style.SUCCESS(f'{action} {len(missing)} 项奖励，保留已有 {len(rows) - len(missing)} 项；积分与兑换记录保持不变。'))
        if category_updates:
            action = '预览：将补齐' if options['dry_run'] else '已补齐'
            self.stdout.write(f'{action} {len(category_updates)} 项奖励的空白分类；已有分类保持不变。')
        if retired:
            action = '预览：将下架' if options['dry_run'] else '已下架'
            self.stdout.write(f'{action} {len(retire_ids)} 项未修改的旧奖励；已修改的旧配置和历史记录保留。')
        if merge_ids:
            action = '预览：将合并' if options['dry_run'] else '已合并'
            self.stdout.write(f'{action} {len(merge_ids)} 项旧设备分类为「娱乐」；名称、价格和兑换历史保留。')
