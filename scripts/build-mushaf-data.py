#!/usr/bin/env python3
"""Builds the Juz 30 (surahs 78-114) Mushaf data (QCF4, Madinah Mushaf 1441H, Uthman Taha) used by the app.

Inputs (npm packages + converted fonts):
  node_modules/quran-qcf4      page JSON files (604 pages)
  node_modules/quran-json      Arabic text + English translation
  assets/fonts/qcf4/*.ttf      created by scripts/prepare-qcf4-fonts.mjs (used for glyph advances)

Outputs:
  src/features/quran/data/qcf4/mushafQcf4.json   per-surah page data
  src/features/quran/data/qcf4/surahTitles.json  decorated surah titles
  src/features/quran/data/verseTextAll.json      verse text for all 114 surahs

Usage: python3 scripts/build-mushaf-data.py
Requires: pip install fonttools
"""
import json
import os
import re
import sys

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QCF4 = os.environ.get("QCF4_DIR", os.path.join(ROOT, "node_modules", "quran-qcf4"))
QJSON = os.environ.get("QJSON_DIR", os.path.join(ROOT, "node_modules", "quran-json", "dist"))
FONTS = os.environ.get("QCF4_TTF_DIR", os.path.join(ROOT, "assets", "fonts", "qcf4"))
OUT_DIR = os.path.join(ROOT, "src", "features", "quran", "data")

# The app ships Juz 30 only (surahs 78-114).
JUZ30 = set(range(78, 115))
# Surahs that keep their hand-tuned QCF v1 pages (see data/mushafPages.ts).
V1_SURAHS = {78}
# Header strings in the source that are garbled (checked against the plain surah names).
TITLE_FIXES = {5: "المَائِدَةِ", 31: "لُقْمَانَ", 86: "الطَّارِقِ"}
CENTER_RATIO = 0.9

_fonts = {}


def advance(font, code):
    if font not in _fonts:
        ttf = TTFont(os.path.join(FONTS, font + ".ttf"), lazy=True)
        _fonts[font] = (ttf.getBestCmap(), ttf["hmtx"].metrics, ttf["head"].unitsPerEm)
    cmap, metrics, _ = _fonts[font]
    return metrics[cmap[code]][0]


def upem(font):
    advance(font, 0xF100) if font not in _fonts else None
    return _fonts[font][2]


def clean_title(text):
    # The source has doubled alifs in a few header strings ("االنَّبَإِ").
    text = re.sub(r"^(\S+)\s+اا", r"\1 ا", text)
    # Most header strings end with the bismillah; the app draws that separately.
    text = re.split(
        r"\s+(?=\u0628[\u064B-\u065F]*\u0633[\u064B-\u065F]*\u0645[\u064B-\u065F]*(?:\s|$))",
        text,
    )[0]
    # Names that do not start with "al-" carry a stray leading alif in the source.
    text = re.sub(r"^(\S+\s)\u0627(?=[^\u0644\u064B-\u065F])", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def main():
    surah_pages = {}  # surah -> list of page objects
    titles = {}

    for page_no in range(582, 605):
        with open(os.path.join(QCF4, "pages", "%03d.json" % page_no), encoding="utf8") as fh:
            page = json.load(fh)

        font = page["font"]
        # Collect lines as (surah, header?, bismillah?, words)
        parsed = []
        for line in page["lines"]:
            words = line["words"]
            if not words:
                continue
            kind = words[0]["type"]
            if kind == "surah_header":
                sura = words[0]["sura"]
                titles.setdefault(sura, clean_title(words[0]["text"])) if sura in JUZ30 else None
                parsed.append((sura, "header", []))
            elif kind == "bismillah":
                parsed.append((words[0]["sura"], "bismillah", []))
            else:
                content = [w for w in words if w["type"] in ("word", "end")]
                if not content:
                    continue
                surahs = {int(w["verse_key"].split(":")[0]) for w in content}
                if len(surahs) != 1:
                    sys.exit("page %d line %s mixes surahs" % (page_no, line["line"]))
                parsed.append((surahs.pop(), "text", content))

        widths = [
            sum(advance(w["font"], w["code"]) for w in words)
            for _, kind, words in parsed
            if kind == "text"
        ]
        widest = max(widths) if widths else 1

        for sura in sorted({s for s, _, _ in parsed}):
            if sura not in JUZ30 or sura in V1_SURAHS:
                continue
            cells, adv, lines, ayahs = [], [], [], []
            header = any(s == sura and k == "header" for s, k, _ in parsed)
            bismillah = any(s == sura and k == "bismillah" for s, k, _ in parsed)

            for s, kind, words in parsed:
                if s != sura or kind != "text":
                    continue
                start = len(cells)
                total = 0
                for w in words:
                    a = advance(w["font"], w["code"])
                    cells.append(w["code"])
                    adv.append(a)
                    ayahs.append((int(w["verse_key"].split(":")[1]), w["type"] == "end"))
                    total += a
                lines.append([start, len(cells), 1 if total / widest < CENTER_RATIO else 0])

            if not cells:
                continue

            verses = []
            index = 0
            while index < len(cells):
                ayah = ayahs[index][0]
                end = index
                marker = -1
                while end < len(cells) and ayahs[end][0] == ayah:
                    if ayahs[end][1]:
                        marker = end
                    end += 1
                verses.append([ayah, index, end, marker])
                index = end

            surah_pages.setdefault(sura, []).append(
                {
                    "p": page_no,
                    "f": font,
                    "u": upem(font),
                    "w": widest,
                    "c": cells,
                    "a": adv,
                    "l": lines,
                    "v": verses,
                    "h": 1 if header else 0,
                    "b": 1 if bismillah else 0,
                }
            )

    # Sanity checks.
    with open(os.path.join(QJSON, "quran_en.json"), encoding="utf8") as fh:
        quran = json.load(fh)
    split = 0
    quran = [c for c in quran if c["id"] in JUZ30]
    for chapter in quran:
        sid = chapter["id"]
        if sid in V1_SURAHS:
            continue
        pages = surah_pages[sid]
        ayahs = [v[0] for pg in pages for v in pg["v"] if v[3] != -1 or True]
        seen = sorted(set(ayahs))
        if seen != list(range(1, chapter["total_verses"] + 1)):
            sys.exit("surah %d verses mismatch" % sid)
        for pg in pages:
            if any(v[3] == -1 for v in pg["v"]):
                split += 1
    print("verses spanning two pages:", split)

    os.makedirs(os.path.join(OUT_DIR, "qcf4"), exist_ok=True)
    with open(os.path.join(OUT_DIR, "qcf4", "mushafQcf4.json"), "w", encoding="utf8") as fh:
        json.dump({str(k): v for k, v in sorted(surah_pages.items())}, fh, separators=(",", ":"))
    for sid, body in TITLE_FIXES.items():
        if sid in JUZ30:
            titles[sid] = "سُورَةُ " + body
    with open(os.path.join(OUT_DIR, "qcf4", "surahTitles.json"), "w", encoding="utf8") as fh:
        json.dump({str(k): v for k, v in sorted(titles.items())}, fh, ensure_ascii=False, separators=(",", ":"))

    verse_text = {
        str(chapter["id"]): [
            {"ar": v["text"], "en": v["translation"]} for v in chapter["verses"]
        ]
        for chapter in quran
    }
    with open(os.path.join(OUT_DIR, "verseTextAll.json"), "w", encoding="utf8") as fh:
        json.dump(verse_text, fh, ensure_ascii=False, separators=(",", ":"))
    fonts = sorted({pg["f"] for pages in surah_pages.values() for pg in pages})
    print("fonts:", ",".join(f.split("_")[-1] for f in fonts))
    print("done:", len(surah_pages), "surahs,", sum(len(v) for v in surah_pages.values()), "page slices")


if __name__ == "__main__":
    main()
