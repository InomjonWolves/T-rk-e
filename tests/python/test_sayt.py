"""Türkçe Yoʻl — Python (pytest) sinov namunasi.

Ishga tushirish (repo ildizidan):
    pip install pytest playwright
    python3 -m pytest tests/python -v

Ikki xil sinov bor:
  1) Fayl sinovlari — brauzersiz, faqat standart kutubxona (sitemap, manifest, lugʻat, sw.js).
  2) Brauzer sinovlari — Playwright: sayt mahalliy serverda ochiladi, mehmon sifatida kiriladi.
"""
import functools
import http.server
import json
import re
import threading
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]  # repo ildizi
SITE = "https://turkceyol.web.app/"


def read(name: str) -> str:
    return (ROOT / name).read_text(encoding="utf-8")


# ---------------------------------------------------------------- 1) Fayl sinovlari

def test_sitemap_faqat_yagona_manzil_va_fayllar_bor():
    root = ET.fromstring(read("sitemap.xml"))
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [e.text for e in root.findall("s:url/s:loc", ns)]
    assert len(locs) > 200, "sitemap juda kichik"
    assert len(locs) == len(set(locs)), "sitemapda takror manzil bor"
    for url in locs:
        assert url.startswith(SITE), f"boshqa domen: {url}"
        rel = url[len(SITE):]
        path = ROOT / rel / "index.html" if rel == "" or rel.endswith("/") else ROOT / rel
        assert path.exists(), f"sitemapdagi sahifa diskda yoʻq: {rel or '/'}"


def test_manifest_toʻgʻri():
    m = json.loads(read("manifest.webmanifest"))
    assert m["id"] == "/"
    assert "Türkçe Yoʻl" in m["name"]
    sizes = {i["sizes"] for i in m["icons"]}
    assert {"192x192", "512x512"} <= sizes
    for icon in m["icons"]:
        assert (ROOT / icon["src"].lstrip("./")).exists(), icon["src"]


def test_sw_kesh_versiyasi_va_fayllari():
    sw = read("sw.js")
    assert re.search(r'const CACHE = "turkce-yol-v\d+"', sw), "CACHE versiyasi topilmadi"
    # index.html dagi har bir js/ skripti mavjud va sw.js keshida bor
    scripts = re.findall(r'src="(js/[\w-]+\.js)"', read("index.html"))
    assert scripts, "index.html da js/ skriptlari topilmadi"
    for s in scripts:
        assert (ROOT / s).exists(), f"fayl yoʻq: {s}"
        assert s in sw, f"sw.js ASSETS da yoʻq: {s}"


def lugat_juftlari():
    """lugat.js dan (daraja, toʻplam, turkcha, oʻzbekcha) qatorlarini oʻqiydi."""
    text = read("lugat.js")
    rows = []
    for m in re.finditer(r'L\("([A-C][12])", "([a-z0-9-]+)",[^`]*`([^`]*)`', text):
        lv, pid, body = m.groups()
        for line in body.strip().splitlines():
            if "=" in line:
                tr, uz = line.split("=", 1)
                rows.append((lv, pid, tr.strip(), uz.strip()))
    return rows


def test_lugat_tuzilishi():
    rows = lugat_juftlari()
    assert len(rows) > 1000
    packs = {pid for _, pid, _, _ in rows}
    assert len(packs) > 60
    for lv, pid, tr, uz in rows:
        assert tr and uz, f"{pid}: boʻsh qator"
        # turkcha tomonda qavs, "/" yoki "..." boʻlmasin (CLAUDE.md qoidasi)
        assert not re.search(r"[()/]|\.\.\.", tr), f"{pid}: {tr!r}"


@pytest.mark.parametrize("soz", ["askar", "komutan", "kışla", "nöbet", "tatbikat"])
def test_taqiqlangan_sozlar_yoq(soz):
    for _, pid, tr, uz in lugat_juftlari():
        # butun soʻz sifatida: «alkışlamak» (qarsak chalmoq) dagi «kışla» hisoblanmaydi
        assert not re.search(rf"(?<!\w){soz}", tr.lower()), f"{pid}: taqiqlangan soʻz {tr!r}"
    assert not re.search(r"\bTYS\b", read("lugat.js"))


# ---------------------------------------------------------------- 2) Brauzer sinovlari

pw = pytest.importorskip("playwright.sync_api")
CHROMIUM = "/opt/pw-browsers/chromium"  # bu muhitda oldindan oʻrnatilgan brauzer


@pytest.fixture(scope="session")
def server():
    """Saytni 127.0.0.1 da tasodifiy portda ochadi (python -m http.server kabi)."""
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a: None
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{httpd.server_port}/"
    httpd.shutdown()


@pytest.fixture(scope="session")
def browser():
    with pw.sync_playwright() as p:
        exe = CHROMIUM if Path(CHROMIUM).exists() else None
        b = p.chromium.launch(executable_path=exe)
        yield b
        b.close()


@pytest.fixture
def page(browser, server):
    """Telefon oʻlchamidagi sahifa: Firebase oʻchiq, tashqi tarmoq yoʻq, JS xatolari yigʻiladi."""
    pg = browser.new_page(viewport={"width": 390, "height": 844})
    pg.errors = []
    pg.on("pageerror", lambda e: pg.errors.append(str(e)))
    pg.route("**/firebase-config.js",
             lambda r: r.fulfill(body="window.FIREBASE_CONFIG=null", content_type="text/javascript"))
    pg.route(re.compile(r"^https?://(?!127\.0\.0\.1)"), lambda r: r.abort())
    pg.add_init_script('sessionStorage["ty-welcomed"]="1"; localStorage["turkce-yol-v1"]=JSON.stringify({onb:1})')
    pg.base = server
    yield pg
    pg.close()


def test_bosh_sahifa_va_menyu(page):
    page.goto(page.base + "#home")
    page.wait_for_selector("#app .view")
    tabs = page.locator("nav [data-tab] span").all_inner_texts()
    assert tabs == ["Asosiy", "Lenta", "Oʻrganish", "Reyting", "Profil"]
    # 390 px da sahifa yonga siljimaydi
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert page.errors == []


@pytest.mark.parametrize("hash_, matn", [
    ("#alphabet", "Alifbo"),
    ("#grammar", "Grammatika"),
    ("#lugat", "Lugʻat"),
    ("#help", "Yordam"),
])
def test_sahifalar_ochiladi(page, hash_, matn):
    page.goto(page.base + hash_)
    page.wait_for_function("document.querySelector('#app .view') && !document.querySelector('#app .cat-loader')")
    assert matn in page.inner_text("#app")
    assert page.errors == []


def test_bitta_lugat_mashqi(page):
    """Aqlli takrorlash / test mashqini boshlab, birinchi savolga javob beradi."""
    page.goto(page.base + "#practice")
    page.wait_for_selector("#app .view")
    page.evaluate("startSession('quiz', 'all')")
    page.wait_for_selector("#session .q-card")
    page.locator("#session .opt").first.click()
    page.wait_for_selector("#session .feedback")
    assert page.get_attribute("#session", "data-r") in ("ok", "no")
    assert page.errors == []
