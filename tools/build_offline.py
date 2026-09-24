"""
Builds download/BackyardBirdFarm.html: the whole game in ONE file.

Double-click that file on a computer and the game plays with no internet.
(On an iPad, use "Add to Home Screen" instead; see the README.)

Run this after changing the game:   python tools/build_offline.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "style.css").read_text(encoding="utf-8")
js = (ROOT / "game.js").read_text(encoding="utf-8")

# A "</script>" inside the code would end the script early, so make sure there isn't one.
assert "</script" not in js.lower(), "game.js contains </script>"


def replace_once(text, old, new):
    assert old in text, f"couldn't find: {old[:60]}"
    return text.replace(old, new, 1)


# Put the styles and the game code right inside the page
html = replace_once(html, '<link rel="stylesheet" href="style.css">', "<style>\n" + css + "\n</style>")
html = replace_once(html, '<script src="game.js"></script>', "<script>\n" + js + "\n</script>")

# Bits that only matter for the website version
html = re.sub(r'\s*<!-- These make it an app.*?-->\n', "\n", html)
html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', "", html)
html = re.sub(r"<script>\s*// Keep a copy of the game.*?</script>\n?", "", html, flags=re.S)

out = ROOT / "download" / "BackyardBirdFarm.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
