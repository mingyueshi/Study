from copy import deepcopy
from fractions import Fraction

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .calculations import comparison, convert, display, parse_amount
from .content import DIMENSIONS, load_data, validate


class ContentTests(SimpleTestCase):
    def test_published_unit_factors_and_estimate_coverage(self):
        data = load_data()
        expected = [
            [1, 10, 100, 1000, 1000000],
            [1, 100, 10000, 1000000, 10000000000, 1000000000000],
            [1, 1000, 1000, 1000000, 1000000, 1000000000],
            [1, 1000, 1000000, 1000000000],
            [1, 60, 3600, 86400],
        ]
        self.assertEqual([[u['factor'] for u in t['units']] for t in data['dimensions']], expected)
        self.assertEqual([case['dimension'] for case in data['estimates']], list(DIMENSIONS))

    def test_schema_rejects_broken_references_values_and_text(self):
        for error in ('factor', 'duplicate', 'example', 'text', 'dimension', 'range', 'terms', 'divisor'):
            data = deepcopy(load_data())
            first = data['dimensions'][0]
            case = data['estimates'][0]
            if error == 'factor':
                first['units'][0]['factor'] = True
            elif error == 'duplicate':
                first['units'][1]['id'] = first['units'][0]['id']
            elif error == 'example':
                first['example']['result'] = '234'
            elif error == 'text':
                first['rule'] = '<script>bad</script>'
            elif error == 'dimension':
                case['unit'] = 'kg'
            elif error == 'range':
                case['lower'] = '481'
            elif error == 'terms':
                case['terms'][0][1] = '0.7'
            else:
                case['divisor'] = '0'
            with self.subTest(error=error), self.assertRaises(ImproperlyConfigured):
                validate(data)


class CalculationTests(SimpleTestCase):
    def test_decimal_and_fullwidth_inputs(self):
        self.assertEqual(parse_amount(' １２．０５ '), Fraction(241, 20))
        self.assertEqual(parse_amount('.002'), Fraction(1, 500))
        self.assertEqual(parse_amount('０'), 0)
        for invalid in ('', '1e4', '-1', '1,500', '1/2', 'NaN', '123456789', '0.0000001', '１５ｍ'):
            with self.subTest(invalid=invalid):
                self.assertIsNone(parse_amount(invalid))

    def test_small_decimal_remains_exact_and_recurring_value_is_marked(self):
        self.assertEqual(display(convert(Fraction(1, 10**6), {'factor': 1}, {'factor': 10**12})),
                         ('0.000000000000000001', True))
        self.assertEqual(display(Fraction(1, 60)), ('0.016666666666666667', False))
        self.assertEqual(display(Fraction(10**18)), ('1000000000000000000', True))

    def test_comparison_uses_reference_as_denominator(self):
        self.assertEqual(comparison(504, Fraction(480)), (24, 5, 1))
        self.assertEqual(comparison(456, Fraction(480)), (24, 5, -1))
        self.assertEqual(comparison(480, Fraction(480)), (0, 0, 0))


class PageTests(TestCase):
    def test_catalog_and_all_seven_pages(self):
        self.assertContains(self.client.get(reverse('home'), {'area': 'math'}), 'href="/measurement/"')
        urls = [reverse('measurement'), reverse('measurement-estimates'),
                *(reverse('measurement-dimension', args=[topic]) for topic in DIMENSIONS)]
        for url in urls:
            with self.subTest(url=url):
                page = self.client.get(url)
                self.assertContains(page, '单位与测量')
                self.assertNotIn(settings.SESSION_COOKIE_NAME, page.cookies)
                self.assertEqual(self.client.head(url).status_code, 200)
                self.assertEqual(self.client.post(url).status_code, 405)
        self.assertEqual(self.client.get('/measurement/missing/').status_code, 404)

    def test_conversion_with_same_units_reverse_and_repeating_time(self):
        url = reverse('measurement-dimension', args=['time'])
        page = self.client.get(url, {'amount': '1', 'from': 'sec', 'to': 'min'})
        self.assertContains(page, '0.016666666666666667 min')
        self.assertContains(page, '1/60 min')
        page = self.client.get(url, {'amount': '1', 'from': 'sec', 'to': 'min', 'op': 'swap'})
        self.assertContains(page, '1 min ＝ 60 s')
        page = self.client.get(url, {'amount': '０', 'from': 'sec', 'to': 'sec'})
        self.assertContains(page, '0 s ＝ 0 s')

    def test_cross_dimension_unit_and_bad_number_are_rejected(self):
        url = reverse('measurement-dimension', args=['length'])
        page = self.client.get(url, {'amount': '<b>2</b>', 'from': 'kg', 'to': 'm'})
        self.assertContains(page, '同类量才能相互换算')
        self.assertContains(page, '请输入非负数')
        self.assertContains(page, '&lt;b&gt;2&lt;/b&gt;')
        self.assertNotContains(page, 'id="conversion-result"')

    def test_estimate_shows_feedback_only_for_the_selected_case(self):
        url = reverse('measurement-estimates')
        page = self.client.get(url, {'case': 'walk-steps', 'guess': '504'})
        self.assertContains(page, '比参考值高 24 m')
        self.assertContains(page, '相对偏差为 5%')
        self.assertContains(page, '落在本题参考范围')
        self.assertContains(page, 'role="status"', count=1)
        page = self.client.get(url, {'case': 'walk-steps', 'guess': '599'})
        self.assertContains(page, '超出本题参考范围')
        page = self.client.get(url, {'case': 'walk-steps', 'guess': '480.001'})
        self.assertContains(page, '相对偏差小于 0.1%')
        self.assertContains(self.client.get(url, {'case': 'walk-steps', 'guess': '-50'}), '请输入非负数')
        self.assertContains(self.client.get(url, {'case': 'missing', 'guess': '1'}), '请选择下方的一项')
