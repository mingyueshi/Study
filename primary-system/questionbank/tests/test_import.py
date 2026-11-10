"""导入管线：幂等、回执防重、冲突保护与 dry-run。"""
import json

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from questionbank import importing, types
from questionbank.models import AnswerRecord, ImportReceipt, Question

from .test_models import make_question


def make_entry(**overrides):
    fields = dict(type='choice', area='math', grade=4, stem='10 个一万是多少？',
                  payload={'options': ['十万', '一万'], 'answer': 0, 'explanation': '10 个一万是十万。'},
                  tags=['数学·认识更大的数'], source_key='primary-math', source_ref='math:mu1-1:example')
    fields.update(overrides)
    fields.setdefault('uuid', str(types.question_uuid(fields['source_key'], fields['source_ref'])))
    return fields


def make_batch(entries, batch_id='test-batch-01'):
    return {'schema_version': 1, 'batch_id': batch_id,
            'generator': 'questionbank/tests', 'questions': list(entries)}


def seed_question(entry):
    """把一条 entry 原样写进库，构造「已存在」场景。"""
    question = Question(uuid=entry['uuid'], type=entry['type'], area=entry['area'], grade=entry.get('grade'),
                        stem=entry['stem'], payload=entry['payload'], tags=entry['tags'],
                        source_key=entry['source_key'], source_ref=entry['source_ref'])
    question.save()
    return question


class ImportBatchTests(TestCase):
    def test_import_creates_questions_and_receipt(self):
        report = importing.import_batch(make_batch([make_entry(), make_entry(source_ref='math:mu1-2:example')]))
        self.assertEqual(report['status'], 'imported')
        self.assertEqual(report['imported'], 2)
        self.assertEqual(Question.objects.count(), 2)
        self.assertTrue(ImportReceipt.objects.filter(batch_id='test-batch-01').exists())

    def test_reimport_same_batch_is_idempotent(self):
        batch = make_batch([make_entry()])
        importing.import_batch(batch)
        report = importing.import_batch(batch)
        self.assertEqual(report['status'], 'already')
        self.assertEqual(Question.objects.count(), 1)

    def test_receipt_does_not_hide_missing_or_changed_questions(self):
        batch = make_batch([make_entry(track='olympiad')])
        importing.import_batch(batch)
        question = Question.objects.get()
        old_checksum = question.checksum
        question.track = Question.Track.REGULAR
        question.save(update_fields=['track'])
        question.refresh_from_db()
        self.assertNotEqual(question.checksum, old_checksum)
        with self.assertRaisesMessage(ValidationError, '内容不同'):
            importing.import_batch(batch, verify_only=True)
        # 即便批量写入留下过期指纹，也须比对实际字段。
        Question.objects.update(checksum=old_checksum)
        with self.assertRaisesMessage(ValidationError, '内容不同'):
            importing.import_batch(batch, verify_only=True)
        question.delete()
        with self.assertRaisesMessage(ValidationError, '缺少 1 道题'):
            importing.import_batch(batch, verify_only=True)
        self.assertFalse(Question.objects.exists())

    def test_same_batch_id_with_new_content_rejected(self):
        importing.import_batch(make_batch([make_entry()]))
        changed = make_batch([make_entry(stem='换了一道题。')])
        with self.assertRaises(ValidationError):
            importing.import_batch(changed)

    def test_dry_run_writes_nothing(self):
        report = importing.import_batch(make_batch([make_entry()]), dry_run=True)
        self.assertEqual(report['status'], 'dry-run')
        self.assertEqual(Question.objects.count(), 0)
        self.assertEqual(ImportReceipt.objects.count(), 0)

    def test_revised_batch_retires_old_question_without_changing_its_content_or_records(self):
        original = make_batch([make_entry()])
        importing.import_batch(original)
        question = Question.objects.get()
        record = AnswerRecord.objects.create(question=question, guest_key='guest', given={'value': 0}, correct=True)
        revised = make_batch([make_entry(source_ref='math:mu1-1:example:rev2')], batch_id='test-revision')
        revised['retire'] = {str(question.uuid): question.checksum}

        importing.import_batch(revised, dry_run=True)
        question.refresh_from_db()
        self.assertTrue(question.active)
        self.assertEqual(Question.objects.count(), 1)

        importing.import_batch(revised)
        question.refresh_from_db()
        record.refresh_from_db()
        self.assertFalse(question.active)
        self.assertTrue(record.correct)
        self.assertEqual(record.question_id, question.pk)
        self.assertEqual(Question.objects.filter(active=True).count(), 1)
        self.assertEqual(importing.import_batch(original, verify_only=True)['status'], 'already')
        self.assertEqual(importing.import_batch(revised, verify_only=True)['status'], 'already')
        self.assertEqual(importing.import_batch(revised)['status'], 'already')

        Question.objects.filter(pk=question.pk).update(active=True)
        with self.assertRaisesMessage(ValidationError, '仍在启用'):
            importing.import_batch(revised, verify_only=True)

    def test_invalid_retirement_does_not_publish_revised_questions(self):
        question = seed_question(make_entry())
        entry = make_entry(source_ref='math:mu1-1:example:rev2')
        batch = make_batch([entry])
        for retire in ([str(question.uuid)], {entry['uuid']: question.checksum}, {str(question.uuid): '0' * 64}):
            with self.subTest(retire=retire), self.assertRaises(ValidationError):
                importing.import_batch({**batch, 'retire': retire})
        self.assertEqual(Question.objects.filter(active=True).count(), 1)
        self.assertFalse(ImportReceipt.objects.exists())

    def test_uuid_mismatch_rejected(self):
        entry = make_entry(uuid='00000000-0000-5000-8000-000000000000')
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([entry]))

    def test_duplicate_source_ref_in_batch_rejected(self):
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([make_entry(), make_entry()]))

    def test_unknown_type_and_area_rejected(self):
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([make_entry(type='match')]))
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([make_entry(area='history')]))

    def test_track_defaults_to_regular_and_olympiad_imports(self):
        importing.import_batch(make_batch([make_entry()]))
        self.assertEqual(Question.objects.get().track, Question.Track.REGULAR)
        entry = make_entry(source_key='primary-olympiad', source_ref='olympiad:jitu:01',
                           track='olympiad', tags=['鸡兔同笼'])
        importing.import_batch(make_batch([entry], batch_id='test-olympiad'))
        self.assertEqual(Question.objects.get(source_ref='olympiad:jitu:01').track,
                         Question.Track.OLYMPIAD)

    def test_unknown_track_rejected(self):
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([make_entry(track='hard')]))

    def test_bad_payload_rejected(self):
        entry = make_entry(payload={'options': ['只有一个'], 'answer': 0})
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([entry]))

    def test_english_quotes_in_stem_rejected(self):
        entry = make_entry(stem='He said "hello"——题面不允许英文双引号。')
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([entry]))

    def test_conflicting_content_protected(self):
        entry = make_entry()
        seed_question(entry)
        conflicting = make_entry(stem='同身份、不同内容。')
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([conflicting]))

    def test_identical_content_skipped(self):
        entry = make_entry()
        seed_question(entry)
        report = importing.import_batch(make_batch([entry]))
        self.assertEqual(report['status'], 'imported')
        self.assertEqual(report['imported'], 0)
        self.assertEqual(report['duplicated'], 1)
        self.assertEqual(Question.objects.count(), 1)

    def test_empty_and_malformed_batches_rejected(self):
        with self.assertRaises(ValidationError):
            importing.import_batch({'schema_version': 1, 'batch_id': 'x', 'questions': []})
        with self.assertRaises(ValidationError):
            importing.import_batch({'schema_version': 2, 'batch_id': 'x', 'questions': [make_entry()]})
        with self.assertRaises(ValidationError):
            importing.import_batch(make_batch([make_entry(stem='     ')]))


class CommandTests(TestCase):
    def test_command_imports_file(self):
        payload = make_batch([make_entry()])
        path = self.write_batch(payload)
        call_command('import_questions', '--input', str(path))
        self.assertEqual(Question.objects.count(), 1)

    def test_command_rejects_missing_file(self):
        with self.assertRaises(CommandError):
            call_command('import_questions', '--input', 'no-such-batch.json')

    def test_command_rejects_invalid_json(self):
        path = self.write_batch(None)
        path.write_text('不是 JSON', encoding='utf-8')
        with self.assertRaises(CommandError):
            call_command('import_questions', '--input', str(path))

    def write_batch(self, payload):
        import tempfile
        from pathlib import Path

        file = Path(tempfile.mkdtemp()) / 'batch.json'
        file.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding='utf-8')
        self.addCleanup(lambda: file.unlink(missing_ok=True))
        return file
