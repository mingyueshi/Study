from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from lexicon.importing import stage_manifest
from lexicon.models import LexicalEntry, LexiconAudit, Pronunciation
from lexicon.services import activate_release
from .helpers import allow_public, manifest, row


def idiom_row(key, word, pinyin, explanation='测试释义。'):
    raw = {'word': word, 'explanation': explanation, 'pinyin': pinyin}
    return row(key, word=word, meaning=explanation, reading=pinyin, language='zh', kind='idiom',
               pronunciation={'value': pinyin, 'system': 'pinyin', 'region': ''}, raw=raw,
               field_paths={'headword': '/word', 'definition': '/explanation', 'pronunciation': '/pinyin'})


class ReviewLexiconCommandTests(TestCase):
    def test_publishes_release_and_gates_pinyin_by_format(self):
        release, _ = stage_manifest(manifest(
            [idiom_row('abdy', '阿鼻地狱', 'ā bí dì yù'), idiom_row('jxhs', '钜学鸿生', 'jù xué hóng')],
            source='review-command-test'))
        # 来源未公开准入时必须拒绝，准入决策只走 manage_sources 审计。
        with self.assertRaises(CommandError):
            call_command('review_lexicon', '--release', str(release.pk))
        allow_public(release.source)
        activate_release(release.pk, expected_current='', reason='测试启用')
        call_command('review_lexicon', '--release', str(release.pk))
        self.assertEqual(LexicalEntry.objects.get(headword='阿鼻地狱').status, 'published')
        self.assertEqual(LexicalEntry.objects.get(headword='钜学鸿生').status, 'published')
        self.assertTrue(Pronunciation.objects.get(entry__headword='阿鼻地狱').is_reviewed)
        self.assertFalse(Pronunciation.objects.get(entry__headword='钜学鸿生').is_reviewed)
        self.assertTrue(LexiconAudit.objects.filter(action='review_release').exists())

    def test_dry_run_changes_nothing_and_reports_format_split(self):
        release, _ = stage_manifest(manifest(
            [idiom_row('abdy', '阿鼻地狱', 'ā bí dì yù'), idiom_row('jxhs', '钜学鸿生', 'jù xué hóng')],
            source='review-dryrun-test'))
        allow_public(release.source)
        activate_release(release.pk, expected_current='', reason='测试启用')
        call_command('review_lexicon', '--release', str(release.pk), '--dry-run')
        self.assertEqual(LexicalEntry.objects.filter(status='published').count(), 0)
        self.assertEqual(Pronunciation.objects.filter(is_reviewed=True).count(), 0)
        self.assertEqual(LexicalEntry.objects.count(), 2)
