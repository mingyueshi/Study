import io
import json
import tempfile
from pathlib import Path
from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse

from .models import PointEvent, Redemption, RewardItem
from .categories import CATEGORY_CODES
from .reward_catalog import DEFAULT_SOURCE, load_reward_catalog


class RewardCatalogValidationTests(SimpleTestCase):
    def write_source(self, folder, rewards, version=1):
        path = Path(folder) / 'rewards.json'
        path.write_text(json.dumps({'schema_version': version, 'rewards': rewards}, ensure_ascii=False))
        return path

    def test_published_catalog_has_valid_unique_rewards(self):
        rows = load_reward_catalog()
        self.assertEqual(len(rows), 22)
        self.assertEqual(len({row['name'] for row in rows}), len(rows))
        self.assertEqual((min(row['cost'] for row in rows), max(row['cost'] for row in rows)), (50, 5000))
        self.assertEqual({row['category'] for row in rows}, CATEGORY_CODES)
        self.assertEqual(next(row['category'] for row in rows if row['name'] == '电影任选一部'), 'free_time')

    def test_version_two_requires_a_known_category_and_version_one_still_loads(self):
        row = dict(load_reward_catalog()[0])
        with tempfile.TemporaryDirectory() as folder:
            for value in ('unknown', '', None, [], 1):
                with self.subTest(category=value), self.assertRaises(ValueError):
                    load_reward_catalog(self.write_source(folder, [dict(row, category=value)], version=2))
            row.pop('category')
            with self.assertRaises(ValueError):
                load_reward_catalog(self.write_source(folder, [row], version=2))
            self.assertEqual(load_reward_catalog(self.write_source(folder, [row])), [row])

    def test_retirement_manifest_accepts_legacy_categories_and_explicit_order_only_when_requested(self):
        source = DEFAULT_SOURCE.with_name('rewards-device-time.json')
        rows = load_reward_catalog(source, for_retirement=True)
        self.assertEqual(len(rows), 9)
        self.assertEqual({row['category'] for row in rows}, {'phone', 'tablet', 'game'})
        self.assertEqual([row['sort'] for row in rows], list(range(160, 250, 10)))
        with self.assertRaises(ValueError):
            load_reward_catalog(source)
        with tempfile.TemporaryDirectory() as folder, self.assertRaises(ValueError):
            load_reward_catalog(self.write_source(folder, [dict(rows[0], sort=True)], version=2), for_retirement=True)

    def test_bad_cost_duplicate_name_and_malformed_text_are_rejected(self):
        row = {'name': '家庭寻宝', 'icon': '🎁', 'cost': 30, 'note': '和家人一起找线索。'}
        with tempfile.TemporaryDirectory() as folder:
            for rows, version in [([dict(row, cost=True)], 1), ([dict(row, cost=0)], 1),
                                  ([dict(row, cost=1.5)], 1), ([row, row], 1),
                                  ([dict(row, note='第一行\n第二行')], 1),
                                  ([dict(row, note='用"英文引号"')], 1),
                                  ([dict(row, name='太长' * 30)], 1),
                                  ([dict(row, unknown='未知字段')], 1),
                                  ([row], True), ([], 1)]:
                with self.subTest(rows=rows, version=version), self.assertRaises(ValueError):
                    load_reward_catalog(self.write_source(folder, rows, version))


class RewardCatalogImportTests(TestCase):
    def test_dry_run_does_not_write(self):
        output = io.StringIO()
        call_command('import_rewards', dry_run=True, stdout=output)
        self.assertFalse(RewardItem.objects.exists())
        self.assertIn('将新增 22 项', output.getvalue())

    def test_repeated_import_preserves_parent_edits_and_account_records(self):
        user = get_user_model().objects.create_user('catalog-reader')
        row = load_reward_catalog()[0]
        existing = RewardItem.objects.create(name=row['name'], category='toy', cost=99, icon='🎈', note='家长写的说明。', is_active=False, sort=888)
        custom = RewardItem.objects.create(name='家长自定奖励', cost=50)
        event = PointEvent.objects.create(user=user, code='manual_bonus', points=123, note='已有积分')
        redemption = Redemption.objects.create(user=user, item=existing, item_name=existing.name, cost=17)
        before_event = PointEvent.objects.values().get(pk=event.pk)
        before_redemption = Redemption.objects.values().get(pk=redemption.pk)
        for _ in range(2):
            call_command('import_rewards', stdout=io.StringIO())
        self.assertEqual(RewardItem.objects.count(), 23)
        existing.refresh_from_db()
        self.assertEqual((existing.cost, existing.icon, existing.note, existing.is_active, existing.sort),
                         (99, '🎈', '家长写的说明。', False, 888))
        self.assertEqual(existing.category, 'toy')
        self.assertTrue(RewardItem.objects.filter(pk=custom.pk).exists())
        self.assertEqual(PointEvent.objects.count(), 1)
        self.assertEqual(Redemption.objects.count(), 1)
        self.assertEqual(PointEvent.objects.values().get(pk=event.pk), before_event)
        self.assertEqual(Redemption.objects.values().get(pk=redemption.pk), before_redemption)

    def test_import_fills_only_blank_categories_without_changing_rewards(self):
        row = load_reward_catalog()[0]
        item = RewardItem.objects.create(name=row['name'], cost=777, note='保留家长的说明。', is_active=False)
        call_command('import_rewards', dry_run=True, stdout=io.StringIO())
        item.refresh_from_db()
        self.assertEqual(item.category, '')
        call_command('import_rewards', stdout=io.StringIO())
        item.refresh_from_db()
        self.assertEqual(item.category, 'wish')
        self.assertEqual((item.cost, item.note, item.is_active), (777, '保留家长的说明。', False))
        output = io.StringIO()
        call_command('import_rewards', stdout=output)
        self.assertNotIn('补齐', output.getvalue())

    def test_retiring_previous_catalog_preserves_edits_and_redemption_history(self):
        source = DEFAULT_SOURCE.with_name('rewards-activities.json')
        call_command('import_rewards', source=str(source), stdout=io.StringIO())
        edited = RewardItem.objects.get(name='故事点播券')
        edited.note = '家长改过的说明。'
        edited.save()
        user = get_user_model().objects.create_user('previous-reward-owner')
        old = RewardItem.objects.get(name='客厅寻宝令')
        redemption = Redemption.objects.create(user=user, item=old, item_name=old.name, cost=old.cost)
        before = Redemption.objects.values().get(pk=redemption.pk)
        preview = io.StringIO()
        call_command('import_rewards', retire_source=str(source), dry_run=True, stdout=preview)
        self.assertIn('将下架 17 项', preview.getvalue())
        self.assertEqual(RewardItem.objects.filter(is_active=True).count(), 18)
        for _ in range(2):
            call_command('import_rewards', retire_source=str(source), stdout=io.StringIO())
        self.assertEqual(RewardItem.objects.count(), 40)
        self.assertEqual(RewardItem.objects.filter(is_active=True).count(), 23)
        self.assertTrue(RewardItem.objects.get(pk=edited.pk).is_active)
        self.assertFalse(RewardItem.objects.get(pk=old.pk).is_active)
        self.assertEqual(Redemption.objects.values().get(pk=redemption.pk), before)

    def test_overlapping_retirement_source_is_rejected_without_changes(self):
        with self.assertRaises(CommandError):
            call_command('import_rewards', retire_source=str(DEFAULT_SOURCE), stdout=io.StringIO())
        self.assertFalse(RewardItem.objects.exists())

    def test_device_merge_keeps_redemption_history_and_parent_changes(self):
        source = DEFAULT_SOURCE.with_name('rewards-device-time.json')
        old_items = []
        for row in load_reward_catalog(source, for_retirement=True):
            old_items.append(RewardItem.objects.create(**row))
        edited = old_items[0]
        edited.note = '家长修改过的专属说明。'
        edited.save()
        user = get_user_model().objects.create_user('entertainment-merge-owner')
        event = PointEvent.objects.create(user=user, code='manual_bonus', points=123, note='已有积分')
        redeemed = old_items[1]
        redemption = Redemption.objects.create(user=user, item=redeemed, item_name=redeemed.name, cost=redeemed.cost)
        before_event = PointEvent.objects.values().get(pk=event.pk)
        before_history = Redemption.objects.values().get(pk=redemption.pk)
        preview = io.StringIO()
        call_command('import_rewards', retire_source=str(source), dry_run=True, stdout=preview)
        self.assertIn('将下架 8 项', preview.getvalue())
        self.assertEqual(RewardItem.objects.filter(category__in=['game', 'phone', 'tablet']).count(), 9)
        for _ in range(2):
            call_command('import_rewards', retire_source=str(source), stdout=io.StringIO())
        self.assertEqual(RewardItem.objects.count(), 31)
        self.assertEqual(RewardItem.objects.filter(is_active=True).count(), 23)
        self.assertFalse(RewardItem.objects.filter(category__in=['game', 'phone', 'tablet']).exists())
        self.assertTrue(RewardItem.objects.get(pk=edited.pk).is_active)
        self.assertFalse(RewardItem.objects.get(pk=redeemed.pk).is_active)
        self.assertEqual(Redemption.objects.values().get(pk=redemption.pk), before_history)
        self.assertEqual(PointEvent.objects.values().get(pk=event.pk), before_event)

    def test_invalid_later_row_cannot_partially_import(self):
        rows = load_reward_catalog()[:2]
        rows[1]['cost'] = -1
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'bad.json'
            path.write_text(json.dumps({'schema_version': 2, 'rewards': rows}, ensure_ascii=False))
            with self.assertRaises(CommandError):
                call_command('import_rewards', source=str(path), stdout=io.StringIO())
        self.assertFalse(RewardItem.objects.exists())


class RewardShopTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('shop-reader')
        self.other = get_user_model().objects.create_user('other-reader')
        self.item = RewardItem.objects.create(name='寻宝游戏', cost=30, note='和家人一起找线索。')
        self.hidden = RewardItem.objects.create(name='暂未上架', cost=10, is_active=False)
        PointEvent.objects.create(user=self.user, code='manual_bonus', points=40, note='已有积分')
        Redemption.objects.create(user=self.other, item=self.item, item_name='别人私人的兑换记录', cost=30)

    def test_guest_can_browse_catalog_without_private_queries_or_learning_navigation(self):
        response = self.client.get(reverse('login'))
        self.assertContains(response, f'href="{reverse("rewards-shop")}"')
        navigation = response.content.decode().split('<nav aria-label="主导航">')[1].split('</nav>')[0]
        self.assertNotIn(f'href="{reverse("my-learning")}"', navigation)
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(reverse('rewards-shop'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '寻宝游戏')
        self.assertContains(response, '/accounts/login/?' + urlencode({'next': '/rewards/shop/'}))
        self.assertContains(response, '登录后兑换')
        self.assertNotContains(response, '暂未上架')
        self.assertNotContains(response, '别人私人的兑换记录')
        self.assertNotContains(response, '我的兑换记录')
        self.assertNotContains(response, 'AnonymousUser')
        self.assertNotContains(response, 'name="item"')
        self.assertIsNone(response.context['summary']['balance'])
        self.assertFalse(response.context['items'][0]['can_redeem'])
        self.assertFalse(any('incentives_pointevent' in row['sql'].lower() or 'incentives_redemption' in row['sql'].lower() for row in queries))

    def test_guest_cannot_redeem_and_own_records_remain_unchanged(self):
        response = self.client.post(reverse('rewards-redeem'), {'item': self.item.pk, 'return_to': 'shop'})
        self.assertEqual(response.status_code, 302)
        self.assertIn('/accounts/login/', response.url)
        self.assertEqual(PointEvent.objects.count(), 1)
        self.assertEqual(Redemption.objects.count(), 1)
        self.assertEqual(self.client.post(reverse('rewards-shop')).status_code, 405)

    def test_shop_get_is_read_only_and_filters_private_records(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse('rewards-shop'))
        self.assertContains(response, '寻宝游戏')
        self.assertNotContains(response, '暂未上架')
        self.assertNotContains(response, '别人私人的兑换记录')
        self.assertEqual(response.context['summary']['balance'], 40)
        self.assertTrue(response.context['items'][0]['can_redeem'])
        self.assertContains(response, 'name="return_to" value="shop"')
        navigation = response.content.decode().split('<nav aria-label="主导航">')[1].split('</nav>')[0]
        self.assertIn(f'href="{reverse("my-learning")}"', navigation)
        self.assertEqual(PointEvent.objects.count(), 1)
        self.assertEqual(Redemption.objects.count(), 1)
        self.assertEqual(self.client.post(reverse('rewards-shop')).status_code, 405)

    def test_redemption_returns_to_shop_and_records_one_deduction(self):
        self.client.force_login(self.user)
        response = self.client.post(reverse('rewards-redeem'), {'item': self.item.pk, 'return_to': 'shop'})
        self.assertRedirects(response, reverse('rewards-shop'), fetch_redirect_response=False)
        self.assertEqual(PointEvent.objects.get(user=self.user, code='redeem').points, -30)
        self.assertEqual(Redemption.objects.filter(user=self.user).count(), 1)
        response = self.client.post(reverse('rewards-redeem'), {'item': self.item.pk, 'return_to': 'shop'})
        self.assertRedirects(response, reverse('rewards-shop'), fetch_redirect_response=False)
        self.assertEqual(Redemption.objects.filter(user=self.user).count(), 1)

    def test_return_destination_is_allowlisted_on_error(self):
        self.client.force_login(self.user)
        for destination, expected in [('shop', 'rewards-shop'), ('https://example.com', 'rewards')]:
            response = self.client.post(reverse('rewards-redeem'), {'item': 'invalid', 'return_to': destination})
            self.assertRedirects(response, reverse(expected), fetch_redirect_response=False)


class RewardCategoryFilterTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('import_rewards', stdout=io.StringIO())
        cls.user = get_user_model().objects.create_user('category-reader')
        PointEvent.objects.create(user=cls.user, code='manual_bonus', points=2000, note='已有积分')
        RewardItem.objects.create(name='未上架的玩具', category='toy', cost=10, is_active=False)

    def test_all_groups_and_filter_counts_cover_only_active_rewards(self):
        response = self.client.get(reverse('rewards-shop'))
        expected = {'wish': 7, 'toy': 4, 'snack': 4, 'entertainment': 3, 'free_time': 4}
        self.assertEqual(response.context['total_rewards'], 22)
        self.assertEqual({entry['code']: entry['count'] for entry in response.context['category_filters']}, expected)
        self.assertEqual([group['code'] for group in response.context['category_groups']], list(expected))
        self.assertNotContains(response, '未上架的玩具')
        self.assertContains(response, 'aria-label="奖励分类"')
        for category, count in expected.items():
            with self.subTest(category=category):
                filtered = self.client.get(reverse('rewards-shop'), {'category': category})
                self.assertEqual(filtered.context['selected_category'], category)
                self.assertEqual(len(filtered.context['items']), count)
                self.assertTrue(all(row['item'].category == category for row in filtered.context['items']))
                self.assertEqual(len(filtered.context['category_groups']), 1)
                self.assertEqual(filtered.context['total_rewards'], 22)

    def test_invalid_category_falls_back_to_all_and_empty_category_is_clear(self):
        response = self.client.get(reverse('rewards-shop'), {'category': '//invalid.example'})
        self.assertEqual(response.context['selected_category'], '')
        self.assertEqual(len(response.context['items']), 22)
        RewardItem.objects.filter(category='entertainment').update(is_active=False)
        response = self.client.get(reverse('rewards-shop'), {'category': 'entertainment'})
        self.assertEqual(response.context['selected_category'], 'entertainment')
        self.assertEqual(response.context['items'], [])
        self.assertContains(response, '这一类暂时没有上架奖励')
        self.assertContains(response, '查看全部奖励')
        self.assertEqual(response.context['total_rewards'], 19)

    def test_old_device_links_select_unified_entertainment_and_three_distinct_tiers(self):
        for category in ('phone', 'tablet', 'game', 'entertainment'):
            with self.subTest(category=category):
                response = self.client.get(reverse('rewards-shop'), {'category': category})
                self.assertEqual(response.context['selected_category'], 'entertainment')
                self.assertEqual([row['item'].cost for row in response.context['items']], [50, 90, 160])
                self.assertTrue(all(row['item'].name.startswith('手机、平板娱乐、游戏 · ') for row in response.context['items']))
                self.assertContains(response, reverse('login') + '?' + urlencode({'next': '/rewards/shop/?category=entertainment'}))

    def test_uncategorized_parent_reward_remains_available_in_other_group(self):
        custom = RewardItem.objects.create(name='家长自定奖励', cost=20)
        response = self.client.get(reverse('rewards-shop'), {'category': 'other'})
        self.assertEqual([row['item'].pk for row in response.context['items']], [custom.pk])
        self.assertEqual(response.context['category_filters'][-1]['code'], 'other')
        custom.category = 'entertainment'
        custom.save()
        response = self.client.get(reverse('rewards-shop'), {'category': 'entertainment'})
        self.assertEqual(len(response.context['items']), 4)
        self.assertNotIn('other', [entry['code'] for entry in response.context['category_filters']])

    def test_login_link_and_redemption_preserve_selected_category(self):
        response = self.client.get(reverse('rewards-shop'), {'category': 'toy'})
        next_url = reverse('rewards-shop') + '?category=toy'
        self.assertContains(response, reverse('login') + '?' + urlencode({'next': next_url}))
        self.client.force_login(self.user)
        response = self.client.get(next_url)
        self.assertContains(response, 'name="category" value="toy"')
        item = RewardItem.objects.filter(category='toy', is_active=True).first()
        response = self.client.post(reverse('rewards-redeem'), {'item': item.pk, 'return_to': 'shop', 'category': 'toy'})
        self.assertRedirects(response, next_url, fetch_redirect_response=False)
        self.assertEqual(Redemption.objects.get(user=self.user).item_id, item.pk)
        self.assertEqual(PointEvent.objects.get(user=self.user, code='redeem').points, -item.cost)
        expensive = RewardItem.objects.get(name='500 元大心愿')
        response = self.client.post(reverse('rewards-redeem'), {'item': expensive.pk, 'return_to': 'shop', 'category': 'wish'})
        self.assertRedirects(response, reverse('rewards-shop') + '?category=wish', fetch_redirect_response=False)
        self.assertEqual(Redemption.objects.filter(user=self.user).count(), 1)
        response = self.client.post(reverse('rewards-redeem'), {'item': 'invalid', 'return_to': 'shop', 'category': 'https://invalid.example'})
        self.assertRedirects(response, reverse('rewards-shop'), fetch_redirect_response=False)
