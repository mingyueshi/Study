from urllib.parse import parse_qs, urlparse
from django.test import TestCase
from django.urls import reverse
from reference_library.models import Dataset
from hanzi.models import HanziAsset, UnihanCharacter
from lexicon.reference_models import CedictRecord, CmuPronunciation
from lexicon.lookup_sources import SPECS, ready_sources, reference_results
from lexicon.importing import stage_manifest
from lexicon.services import activate_release, review_objects
from lexicon.models import LexicalEntry, Sense, Pronunciation
from .helpers import manifest, row, allow_public


class UnifiedDictionaryTests(TestCase):
    def setUp(self):
        for code, spec in SPECS.items():
            Dataset.objects.create(
                code=code,
                version=spec[0]._meta.get_field("version").get_default(),
                state="ready",
            )
        self.release, _ = stage_manifest(
            manifest(
                [
                    row("bank", word="bank", meaning="正式银行释义"),
                    row(
                        "wood",
                        word="木",
                        meaning="正式木释义",
                        reading="mù",
                        language="zh",
                        kind="character",
                        pronunciation={"value": "mù", "system": "pinyin", "region": ""},
                    ),
                ]
            )
        )
        allow_public(self.release.source)
        activate_release(self.release.pk, expected_current="", reason="test")
        for model in [LexicalEntry, Sense, Pronunciation]:
            review_objects(model.objects.all(), publish=True)
        self.cedict = CedictRecord.objects.create(
            source_line=2,
            simplified="木",
            traditional="木",
            pinyin_numbered="mu4",
            definitions_en=["tree; wood"],
            source_path="test",
        )
        self.bank = CmuPronunciation.objects.create(
            source_row=2,
            entry="BANK",
            word="bank",
            search_word="bank",
            variant=1,
            phonemes="B AE1 NG K",
            source_path="test",
        )
        CmuPronunciation.objects.create(
            source_row=3,
            entry="BANK(2)",
            word="bank",
            search_word="bank",
            variant=2,
            phonemes="B AE1 NG K",
            source_path="test",
        )
        UnihanCharacter.objects.create(
            character="木",
            codepoint="U+6728",
            mandarin="mù",
            total_strokes="4",
            definition_en="tree",
            properties={"private_list_payload": "should not be loaded"},
        )
        HanziAsset.objects.create(
            character="木", source_row=1, strokes=["M 0 0 L 1 1"], pinyin=["mù"]
        )
        HanziAsset.objects.create(character="⺀", source_row=2, strokes=["M 0 0 L 2 2"])

    def test_same_search_combines_formal_cedict_properties_and_interactive_strokes(
        self,
    ):
        r = self.client.get("/dictionary/", {"q": "木"})
        for text in [
            "正式木释义",
            "tree; wood",
            "Unihan 17",
            "mu4",
            "stroke-next",
            "stroke-reset",
        ]:
            self.assertContains(r, text)
        self.assertEqual(r.context["refs"]["stroke_asset"].character, "木")
        self.assertIn(
            "properties", r.context["refs"]["hanzi"]["page"][0].get_deferred_fields()
        )
        self.cedict.refresh_from_db()
        self.assertIsNone(self.cedict.matched_sense_id)

    def test_formal_details_embed_exact_related_material(self):
        bank = LexicalEntry.objects.get(headword="bank")
        r = self.client.get(reverse("dictionary-entry", args=[bank.pk]))
        self.assertContains(r, "正式银行释义")
        self.assertContains(r, "B AE1 NG K", count=2)
        wood = LexicalEntry.objects.get(headword="木")
        r = self.client.get(reverse("dictionary-entry", args=[wood.pk]))
        self.assertContains(r, "tree; wood")
        self.assertContains(r, "stroke-next")

    def test_cmu_variants_are_preserved_in_search_and_detail(self):
        r = self.client.get("/dictionary/", {"q": "bank", "scope": "english"})
        self.assertEqual(r.context["refs"]["cmu"]["page"].paginator.count, 2)
        self.assertContains(r, "B AE1 NG K", count=2)
        self.assertIsNone(r.context["refs"]["cedict"])
        self.assertContains(
            self.client.get("/references/lexicon/cmu/bank/"), "B AE1 NG K", count=2
        )

    def test_not_ready_sources_hide_search_and_direct_details(self):
        Dataset.objects.update(state="pending")
        r = self.client.get("/dictionary/", {"q": "木"})
        self.assertContains(r, "正式木释义")
        self.assertNotContains(r, "tree; wood")
        self.assertNotContains(r, "stroke-next")
        for path in [
            reverse("reference-cedict-detail", args=[self.cedict.pk]),
            "/references/lexicon/cmu/bank/",
            "/hanzi/木/",
        ]:
            self.assertEqual(self.client.get(path).status_code, 404)

    def test_old_rows_do_not_leak_via_search_or_detail(self):
        old = CedictRecord.objects.create(
            version="old",
            source_line=1,
            simplified="木",
            traditional="木",
            pinyin_numbered="SECRET_OLD",
            definitions_en=["OLD_CEDICT"],
            source_path="test",
        )
        CmuPronunciation.objects.create(
            version="old",
            source_row=1,
            entry="bank",
            word="bank",
            search_word="bank",
            variant=0,
            phonemes="OLD_CMU",
            source_path="test",
        )
        UnihanCharacter.objects.create(
            version="old", character="木", codepoint="U+6728", mandarin="OLD_UNIHAN"
        )
        HanziAsset.objects.create(
            version="old", character="木", source_row=1, decomposition="OLD_ASSET"
        )
        for q in ["木", "bank"]:
            r = self.client.get("/dictionary/", {"q": q})
            for secret in ["OLD_CEDICT", "OLD_CMU", "OLD_UNIHAN", "OLD_ASSET"]:
                self.assertNotContains(r, secret)
        self.assertEqual(
            self.client.get(
                reverse("reference-cedict-detail", args=[old.pk])
            ).status_code,
            404,
        )
        self.assertNotContains(self.client.get("/hanzi/木/"), "OLD_UNIHAN")
        Dataset.objects.filter(code="cc-cedict").update(version="old")
        self.assertEqual(
            self.client.get(
                reverse("reference-cedict-detail", args=[old.pk])
            ).status_code,
            404,
        )

    def test_precise_match_before_source_order_and_pagination_keeps_scope(self):
        for i in range(12):
            CedictRecord.objects.create(
                source_line=10 + i,
                simplified="木" + str(i),
                traditional="木" + str(i),
                pinyin_numbered="mu4",
                definitions_en=["prefix"],
                source_path="test",
            )
        self.cedict.source_line = 100
        self.cedict.save(update_fields=["source_line"])
        r = self.client.get("/dictionary/", {"q": "木", "scope": "chinese"})
        section = r.context["refs"]["cedict"]
        self.assertEqual(section["page"][0].pk, self.cedict.pk)
        params = parse_qs(urlparse(section["next_url"]).query)
        self.assertEqual(params["q"], ["木"])
        self.assertEqual(params["scope"], ["chinese"])
        self.assertEqual(params["cedict_page"], ["2"])
        second = self.client.get("/dictionary/" + section["next_url"])
        self.assertEqual(second.context["refs"]["cedict"]["page"].number, 2)

    def test_component_and_codepoint_lookup_without_canonical_entry(self):
        for q in ["⺀", "U+2E80"]:
            r = self.client.get("/dictionary/", {"q": q, "scope": "character"})
            self.assertContains(r, "⺀")
            self.assertContains(r, "stroke-next")
            self.assertContains(r, "/hanzi/")
        self.assertEqual(self.client.get("/hanzi/⺀/").status_code, 200)

    def test_compatibility_character_is_not_folded(self):
        UnihanCharacter.objects.create(
            character="豈", codepoint="U+F900", mandarin="COMPAT"
        )
        UnihanCharacter.objects.create(
            character="豈", codepoint="U+8C48", mandarin="FOLDED_SECRET"
        )
        for q in ["豈", "U+F900"]:
            r = self.client.get("/dictionary/", {"q": q})
            self.assertContains(r, "COMPAT")
            self.assertNotContains(r, "FOLDED_SECRET")

    def test_cedict_surname_capitalization_is_not_deduplicated(self):
        for i, py in enumerate(["Wang2", "wang2"], 10):
            CedictRecord.objects.create(
                source_line=i,
                simplified="王",
                traditional="王",
                pinyin_numbered=py,
                definitions_en=[py],
                source_path="test",
            )
        r = self.client.get("/dictionary/", {"q": "王", "scope": "chinese"})
        self.assertEqual(r.context["refs"]["cedict"]["page"].paginator.count, 2)
        self.assertContains(r, "Wang2")
        self.assertContains(r, "wang2")

    def test_no_reversed_english_gloss_lookup(self):
        r = self.client.get("/dictionary/", {"q": "tree", "scope": "english"})
        self.assertIsNone(r.context["refs"]["cedict"])
        self.assertNotContains(r, "tree; wood")

    def test_private_formal_source_never_exposes_formal_data(self):
        self.release.source.public_allowed = False
        self.release.source.save(update_fields=["public_allowed"])
        r = self.client.get("/dictionary/", {"q": "木"})
        self.assertNotContains(r, "正式木释义")
        self.assertContains(r, "tree; wood")
        entry = LexicalEntry.objects.get(headword="木")
        self.assertEqual(
            self.client.get(reverse("dictionary-entry", args=[entry.pk])).status_code,
            404,
        )

    def test_empty_query_and_legacy_lists_have_unified_entry(self):
        r = self.client.get("/dictionary/")
        self.assertContains(r, "示例查询")
        self.assertNotContains(r, "tree; wood")
        for path, key, scope in [
            ("/hanzi/", "hanzi_page", "character"),
            ("/references/lexicon/cedict/", "cedict_page", "chinese"),
            ("/references/lexicon/cmu/", "cmu_page", "english"),
        ]:
            r = self.client.get(path, {"q": "木", "page": "2"})
            self.assertEqual(r.status_code, 302)
            params = parse_qs(urlparse(r.url).query)
            self.assertEqual(params[key], ["2"])
            self.assertEqual(params["scope"], [scope])
            self.assertEqual(params["q"], ["木"])
        self.assertContains(self.client.get("/references/"), "查字查词")
        self.assertEqual(
            self.client.get("/references/").content.count(b'class="book-card"'), 5
        )

    def test_request_snapshot_cannot_bypass_later_source_deactivation(self):
        ready = ready_sources()
        Dataset.objects.filter(code="cc-cedict").update(state="pending")
        refs = reference_results("木", "chinese", {}, ready=ready)
        self.assertEqual(refs["cedict"]["page"].paginator.count, 0)

    def test_provenance_hashes_are_in_disclosures_and_strokes_have_named_controls(self):
        response = self.client.get("/dictionary/", {"q": "木"})
        self.assertContains(response, 'aria-label="木笔顺图"')
        self.assertContains(response, 'class="button small" id="stroke-next"')
        self.assertContains(response, "<summary>笔顺来源与版本</summary>")
        response = self.client.get("/dictionary/", {"q": "bank", "scope": "english"})
        self.assertContains(response, "<summary>CMU来源与版本</summary>")
