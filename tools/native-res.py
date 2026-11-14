# Draws the Android app's launcher icons and splash images (native/android/app/src/main/res) from the site icons.
# Run after the icons change (node tools/icons.js): python3 tools/native-res.py
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "native", "android", "app", "src", "main", "res")
SAND = (247, 244, 238)  # --bg #f7f4ee
round_icon = Image.open(os.path.join(ROOT, "icon-512.png")).convert("RGBA")
maskable = Image.open(os.path.join(ROOT, "icon-maskable-512.png")).convert("RGBA")
DPI = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

for d, k in DPI.items():
    folder = os.path.join(RES, "mipmap-" + d)
    os.makedirs(folder, exist_ok=True)
    s = round(48 * k)
    for name in ("ic_launcher.png", "ic_launcher_round.png"):
        round_icon.resize((s, s), Image.LANCZOS).save(os.path.join(folder, name))
    # Adaptive icon foreground: 108 dp, the full-bleed maskable icon (Android masks the middle 72 dp)
    f = round(108 * k)
    maskable.resize((f, f), Image.LANCZOS).save(os.path.join(folder, "ic_launcher_foreground.png"))

# Adaptive icon background: the maskable icon's own edge colour
r, g, b, _ = maskable.getpixel((4, 4))
with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w") as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % (r, g, b))

# Splash (Android 11 and older; Android 12+ shows the icon on windowSplashScreenBackground): the round icon on sand
for root, _, files in os.walk(RES):
    if "splash.png" in files:
        p = os.path.join(root, "splash.png")
        w, h = Image.open(p).size
        canvas = Image.new("RGB", (w, h), SAND)
        s = int(min(w, h) * 0.36)
        canvas.paste(round_icon.resize((s, s), Image.LANCZOS), ((w - s) // 2, (h - s) // 2), round_icon.resize((s, s), Image.LANCZOS))
        canvas.save(p, optimize=True)
print("ok", RES)
