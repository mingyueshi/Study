from django.test import TestCase
from reference_library.models import Dataset
from .models import HanziAsset, UnihanCharacter, UnihanProperty


class HanziViewTests(TestCase):
    def setUp(self):
        Dataset.objects.create(code="unihan17", state="ready", version="17.0.0")
        Dataset.objects.create(
            code="makemeahanzi",
            state="ready",
            version="bddc96d41bef78427ed0e034e9f7e31d71fd1b92",
        )
        for character, mandarin in [("学", "xué"), ("𠀀", "hē"), ("豈", "qǐ")]:
            row = UnihanCharacter.objects.create(
                character=character,
                codepoint=f"U+{ord(character):04X}",
                mandarin=mandarin,
                properties={"kMandarin": mandarin},
            )
            UnihanProperty.objects.create(
                character=row,
                name="kMandarin",
                value=mandarin,
                source_file="Unihan_Readings.txt",
                source_line=10,
            )
        HanziAsset.objects.create(
            character="⺆",
            source_row=1,
            pinyin=[],
            dictionary_data={},
            strokes=["M 0 0 L 1 1"],
            medians=[[[0, 0], [1, 1]]],
        )

    def test_single_letter_pinyin_prefix_is_searchable(self):
        response = self.client.get("/hanzi/", {"q": "x"}, follow=True)
        self.assertContains(response, "学")
        self.assertEqual(response.context["refs"]["hanzi"]["page"].paginator.count, 1)

    def test_supplementary_and_compatibility_characters_stay_distinct(self):
        self.assertEqual(UnihanCharacter.objects.count(), 3)
        self.assertEqual(self.client.get("/hanzi/𠀀/").status_code, 200)
        self.assertEqual(self.client.get("/hanzi/豈/").status_code, 200)
        self.assertEqual(self.client.get("/hanzi/豈/").status_code, 404)

    def test_stroke_only_component_has_search_and_step_svg(self):
        self.assertContains(
            self.client.get("/hanzi/", {"q": "⺆"}, follow=True),
            "此部件在笔顺字典中收录",
        )
        response = self.client.get("/hanzi/⺆/")
        self.assertContains(response, "Unihan 17 未收录")
        self.assertContains(response, "translate(0,776) scale(1,-1)")
        self.assertContains(response, "stroke-next")
        self.assertContains(response, "stroke-reset")
