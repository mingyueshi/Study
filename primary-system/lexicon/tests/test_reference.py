from django.test import TestCase
from django.core.exceptions import ValidationError
from reference_library.models import Dataset
from lexicon.models import Sense
from lexicon.reference_models import CmuPronunciation
from lexicon.reference_importing import publish, validate_existing


class CandidateImportTests(TestCase):
    def rows(self):
        # Equal word and equal phonemes are still two source variants.
        return [
            CmuPronunciation(
                source_row=i,
                entry=f"WORD({i})",
                word="WORD",
                search_word="word",
                variant=i,
                phonemes="W ER1 D",
                source_path="source.csv",
            )
            for i in (1, 2)
        ]

    def publish(self, dry=False):
        return publish(
            "cmudict",
            "读音",
            "74790861f652b15e4ac49015a90074ad62a27690",
            "a" * 64,
            CmuPronunciation,
            self.rows(),
            2,
            dry,
        )

    def test_dry_run_no_writes_and_duplicate_pronunciations_preserved(self):
        before = Sense.objects.count()
        self.publish(True)
        self.assertEqual(Dataset.objects.count(), 0)
        self.assertEqual(CmuPronunciation.objects.count(), 0)
        self.publish()
        self.assertEqual(CmuPronunciation.objects.count(), 2)
        self.assertEqual(Sense.objects.count(), before)
        self.assertEqual(self.publish()["unchanged"], 2)
        self.assertEqual(self.publish(True)["unchanged"], 2)

    def test_ready_dataset_missing_row_rejected_even_in_preview(self):
        self.publish()
        CmuPronunciation.objects.first().delete()
        with self.assertRaises(ValidationError):
            self.publish(True)
        with self.assertRaises(ValidationError):
            self.publish()
        self.assertEqual(CmuPronunciation.objects.count(), 1)

    def test_same_count_source_field_drift_rejected_without_overwrite(self):
        self.publish()
        CmuPronunciation.objects.filter(source_row=1).update(phonemes="MANUAL")
        with self.assertRaises(ValidationError):
            self.publish(True)
        with self.assertRaises(ValidationError):
            self.publish()
        self.assertEqual(CmuPronunciation.objects.get(source_row=1).phonemes, "MANUAL")

    def test_digest_drift_and_orphan_rows_rejected(self):
        self.publish()
        with self.assertRaises(ValidationError):
            validate_existing(
                "cmudict", "wrong", "a" * 64, [(CmuPronunciation.objects.all(), 2)]
            )
        Dataset.objects.all().delete()
        with self.assertRaises(ValidationError):
            self.publish(True)
        with self.assertRaises(ValidationError):
            self.publish()

    def test_multiple_variants_view_explains_arpabet(self):
        self.publish()
        response = self.client.get("/references/lexicon/cmu/word/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "ARPAbet")
        self.assertContains(response, "没有音频")
        self.assertContains(response, "W ER1 D", count=2)
