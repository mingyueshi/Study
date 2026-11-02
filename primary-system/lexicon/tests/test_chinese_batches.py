from copy import deepcopy
from django.core.exceptions import ValidationError
from catalog.tests import PlatformFixture
from lexicon.tests import test_chinese as fixtures
from lexicon.chinese_batches import import_batch as real_import_batch,digest

def import_batch(m,**kwargs):
    return real_import_batch(m,expected_digest=digest(m),**kwargs)
from lexicon.models import ChineseSenseVersion,ChineseReview,ChineseBatchReceipt
from words.models import TargetChineseAdoption,WordProgress
from learning.models import Progress
from lexicon.chinese import review_chinese

REVIEWER='AI: Codex 主控 AI（独立逐条复核）'

def manifest_for(test):
    obj=test.goal;r=test.record
    from lexicon.models import Pronunciation
    Pronunciation.objects.filter(pk=obj.pronunciation_id).update(is_reviewed=True)
    s={'domain':'target','object_id':str(obj.pk),'label':'bank','positions':[{'scenario':'bank','order':0}], 'reference_id':str(obj.placements.first().pk),'sense_id':str(obj.sense_id),'pronunciation_id':str(obj.pronunciation_id),'evidence_id':str(r.pk),
       'snapshot':obj.editorial_snapshot,'source_code':r.release.source.code,'source_key':r.binding.external_key,
       'release_version':r.release.version,'release_checksum':r.release.checksum,'raw_hash':r.raw_hash,'lexical_hash':r.lexical_hash,'presentation_revision':0}
    return {'batch_id':'test-fixed-batch','reviewer':REVIEWER,'review_status':'approved','entries':[{'key':'a','review_status':'approved','selection':s,'text':'银行机构','example':'','kind':'teaching','origin':'ai','generation_tool':'Codex test AI','author_label':'AI test','learning_effect':'same','same_reason':'保留固定含义'}]}

class BatchTests(PlatformFixture):
    setUp=fixtures.ChineseTests.setUp
    def test_dry_run_repeat_no_duplicate_or_progress(self):
        m=manifest_for(self)
        self.assertEqual(import_batch(m,reviewer=REVIEWER,dry_run=True)['created'],1)
        self.assertFalse(ChineseSenseVersion.objects.exists());self.assertFalse(ChineseBatchReceipt.objects.exists())
        import_batch(m,reviewer=REVIEWER)
        counts=(ChineseSenseVersion.objects.count(),ChineseReview.objects.count(),TargetChineseAdoption.objects.count())
        self.assertEqual(import_batch(m,reviewer=REVIEWER)['unchanged'],1)
        self.assertEqual((ChineseSenseVersion.objects.count(),ChineseReview.objects.count(),TargetChineseAdoption.objects.count()),counts);self.assertEqual(counts,(1,1,1));self.assertFalse(WordProgress.objects.exists());self.assertFalse(Progress.objects.exists())
    def test_partial_conflict_rolls_back_whole_batch(self):
        m=manifest_for(self);second=deepcopy(m['entries'][0]);second['key']='bad';second['selection']['snapshot']={};m['entries'].append(second)
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.assertFalse(ChineseSenseVersion.objects.exists());self.assertFalse(ChineseBatchReceipt.objects.exists())
    def test_withdrawal_is_not_recreated(self):
        m=manifest_for(self);import_batch(m,reviewer=REVIEWER)
        v=ChineseSenseVersion.objects.get();review_chinese(v.pk,expected_revision=1,decision='withdrawn',reviewer='AI test',note='撤回')
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.assertEqual(ChineseSenseVersion.objects.count(),1);self.assertEqual(ChineseReview.objects.count(),2)
    def test_changed_manifest_or_pending_review_rejected(self):
        m=manifest_for(self);import_batch(m,reviewer=REVIEWER)
        m['entries'][0]['text']='不同正文'
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        m['review_status']='pending'
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
    def test_source_revision_drift_does_not_refresh(self):
        from lexicon.services import revise
        m=manifest_for(self);import_batch(m,reviewer=REVIEWER)
        revise(self.goal.sense,value='new',note='源修订',expected_revision=0)
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.assertEqual(ChineseSenseVersion.objects.count(),1)


from unittest import skipUnless
from django.db import connection
from django.test import TransactionTestCase
from lexicon.tests import test_chinese_concurrency as races

@skipUnless(connection.vendor=='postgresql','PG row locks required')
class BatchConcurrencyTests(TransactionTestCase):
    race=races.ChineseConcurrencyTests.race
    def setUp(self):
        races.ChineseConcurrencyTests.setUp(self)
        self.goal=self.target
    def test_concurrent_first_batch_has_one_creation_and_one_noop(self):
        m=manifest_for(self);m['entries'][0]['selection']['positions']=[{'scenario':'race','order':0}]
        result=self.race(lambda:import_batch(m,reviewer=REVIEWER),lambda:import_batch(m,reviewer=REVIEWER))
        self.assertEqual(result,['saved','saved'])
        self.assertEqual(ChineseBatchReceipt.objects.count(),1)
        self.assertEqual((ChineseSenseVersion.objects.count(),ChineseReview.objects.count(),TargetChineseAdoption.objects.count()),(1,1,1))

class BatchIdentityTests(PlatformFixture):
    setUp=fixtures.ChineseTests.setUp
    def test_unapproved_digest_and_pending_entry_rejected(self):
        m=manifest_for(self)
        with self.assertRaises(ValidationError):real_import_batch(m,reviewer=REVIEWER,expected_digest='wrong')
        m['entries'][0]['review_status']='pending'
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
    def test_same_evidence_new_target_and_position_drift_rejected(self):
        from words.test_targets import target
        m=manifest_for(self)
        self.word.target=target(self.record);self.word.save()
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.assertFalse(ChineseBatchReceipt.objects.exists())
    def test_later_manual_selection_is_not_overwritten(self):
        from lexicon.chinese import adopt_chinese
        m=manifest_for(self);import_batch(m,reviewer=REVIEWER)
        a=ChineseSenseVersion.objects.get()
        b=fixtures.ChineseTests.version(self,text='银行教学说明',previous=a)
        adopt_chinese(target_id=self.goal.pk,version_id=b.pk,expected_revision=1,expected_review_revision=1,reason='后来人工选择')
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.goal.refresh_from_db();self.assertEqual(self.goal.chinese_version_id,b.pk)

    def test_failure_during_later_create_rolls_back_already_written_first_row(self):
        m=manifest_for(self);bad=deepcopy(m['entries'][0]);bad['key']='later';bad['text']='English only invalid Chinese';m['entries'].append(bad)
        with self.assertRaises(ValidationError):import_batch(m,reviewer=REVIEWER)
        self.assertFalse(ChineseSenseVersion.objects.exists());self.assertFalse(ChineseReview.objects.exists());self.assertFalse(TargetChineseAdoption.objects.exists())
        self.goal.refresh_from_db();self.assertIsNone(self.goal.chinese_version_id)
