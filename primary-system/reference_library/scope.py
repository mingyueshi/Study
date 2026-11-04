"""Current import scope. Retired inputs remain in the historical audit manifest."""

SCOPE = "reference-library-20261104-poetry-simplified"
ACTIVE_ARCHIVES = frozenset(
    {
        "01a_cc_cedict_2026-11-02.zip",
        "01b_hanzi_strokes_2026-11-02.zip",
        "01c_unihan_17_2026-11-02.zip",
        "01d_classical_poetry_simplified_2026-11-04.zip",
        "02a_geography_english_elements_math_2026-11-02.zip",
        "02b_hyg_stars_2026-11-02.zip",
    }
)
MIXED_ARCHIVE = "02a_geography_english_elements_math_2026-11-02.zip"


def retains_member(archive_name, member):
    return not (archive_name == MIXED_ARCHIVE and member.startswith("math_seed/"))
