#!/usr/bin/env python3
"""Builds the site's font files (fonts/onest-v1.woff2, fonts/onest-cyr-v1.woff2) from the Onest variable font.

Source: https://github.com/google/fonts/tree/main/ofl/onest  (Onest[wght].ttf, SIL Open Font License 1.1 — fonts/OFL.txt)
Needs:  pip install fonttools brotli
Run:    python3 tools/font-subset.py path/to/Onest[wght].ttf

What it does: keeps the weights the site uses (400–900), keeps only the characters the site needs (Latin with the
Turkish letters, Uzbek ʻ and ʼ, punctuation, arrows; Cyrillic in a second file that is downloaded only when needed)
and points the non-breaking hyphen (U+2011, used before suffixes like ‑ga) at the ordinary hyphen glyph.
If the character set changes, give the files a new version number (onest-v2…): they are cached for a year.
"""
import os
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SRC = sys.argv[1] if len(sys.argv) > 1 else "Onest[wght].ttf"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")

LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | {
    0x11E, 0x11F, 0x130, 0x131, 0x15E, 0x15F, 0x152, 0x153, 0x2BB, 0x2BC, 0x2C6, 0x2DC,
    0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015, 0x2018, 0x2019, 0x201A, 0x201C, 0x201D, 0x201E, 0x2020, 0x2021,
    0x2022, 0x2026, 0x2030, 0x2039, 0x203A, 0x2044, 0x20AC, 0x2116, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212,
    0x2248, 0x2260, 0x2264, 0x2265, 0x2713, 0x221E}
CYRILLIC = set(range(0x400, 0x460)) | {0x490, 0x491, 0x492, 0x493, 0x49A, 0x49B, 0x4B2, 0x4B3, 0x4E8, 0x4E9, 0x4AE,
                                        0x4AF, 0x4D8, 0x4D9, 0x2116}


def build(name, unicodes, alias=None):
    font = instancer.instantiateVariableFont(TTFont(SRC), {"wght": (400, 900)})
    for table in font["cmap"].tables:
        if table.isUnicode():
            for a, b in (alias or {}).items():
                if b in table.cmap and a not in table.cmap:
                    table.cmap[a] = table.cmap[b]
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "mark", "mkmk", "ccmp", "calt", "tnum", "pnum", "locl", "case", "liga"]
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = True
    opts.drop_tables += ["DSIG", "meta"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    path = os.path.join(OUT, name)
    font.flavor = "woff2"
    font.save(path)
    print(name, os.path.getsize(path), "bytes,", len(TTFont(path).getBestCmap()), "characters")


build("onest-v1.woff2", LATIN, alias={0x2011: 0x2D})
build("onest-cyr-v1.woff2", CYRILLIC)
