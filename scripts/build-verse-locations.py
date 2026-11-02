#!/usr/bin/env python3
"""Builds the printed-mushaf location (page + line) of every Juz 30 verse.

Input:  node_modules/quran-qcf4/pages/NNN.json  (Madinah Mushaf 1441H; "line" is the printed line, 1-15)
Output: src/features/quran/data/verseLocations.json
        { "<surahId>": [[startPage, startLine, endPage, endLine], ...] }   index = ayah - 1

Used by the page / line quiz questions (utils/quiz.ts).
Usage: python3 scripts/build-verse-locations.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QCF4 = os.environ.get("QCF4_DIR", os.path.join(ROOT, "node_modules", "quran-qcf4"))
OUT = os.path.join(ROOT, "src", "features", "quran", "data")
JUZ30 = range(78, 115)
FIRST_PAGE, LAST_PAGE = 582, 604


def main():
    spans = {}  # (surah, ayah) -> [startPage, startLine, endPage, endLine]

    for page_no in range(FIRST_PAGE, LAST_PAGE + 1):
        with open(os.path.join(QCF4, "pages", "%03d.json" % page_no), encoding="utf8") as fh:
            page = json.load(fh)

        for line in page["lines"]:
            for word in line["words"]:
                if word["type"] not in ("word", "end"):
                    continue
                surah, ayah = (int(x) for x in word["verse_key"].split(":"))
                if surah not in JUZ30:
                    continue
                key = (surah, ayah)
                here = [page_no, line["line"]]
                if key not in spans:
                    spans[key] = here + here
                else:
                    spans[key][2:] = here

    with open(os.path.join(OUT, "verseTextAll.json"), encoding="utf8") as fh:
        texts = json.load(fh)

    result = {}
    for surah in JUZ30:
        count = len(texts[str(surah)])
        rows = []
        for ayah in range(1, count + 1):
            if (surah, ayah) not in spans:
                sys.exit("missing location for %d:%d" % (surah, ayah))
            rows.append(spans[(surah, ayah)])
        result[str(surah)] = rows

    with open(os.path.join(OUT, "verseLocations.json"), "w", encoding="utf8") as fh:
        json.dump(result, fh, separators=(",", ":"))

    total = sum(len(rows) for rows in result.values())
    print("wrote %d verse locations for %d surahs" % (total, len(result)))


if __name__ == "__main__":
    main()
