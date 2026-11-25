"""Gera os cards de prospecção (1080x1080) de cada site-modelo da IONEXT.

Uso: python3 render.py <pasta do repo ionext> <pasta de saída>
"""
import sys, pathlib, html
from playwright.sync_api import sync_playwright

REPO = pathlib.Path(sys.argv[1]).resolve()
OUT = pathlib.Path(sys.argv[2]).resolve()
FONTS = pathlib.Path(__file__).parent / "node_modules"

# slug -> (artigo + ramo para o título, ramo curto para o selo)
MODELOS = {
    "loja-smartphones": ("a sua loja de celulares", "loja de celulares"),
    "assistencia-express": ("a sua assistência técnica", "assistência técnica"),
    "reparo-placas": ("o seu laboratório", "reparo de placas"),
    "barbearia-urbana": ("a sua barbearia", "barbearia"),
    "barbearia-classica": ("a sua barbearia", "barbearia"),
    "salao-beleza": ("o seu salão", "salão de beleza"),
    "hamburgueria": ("a sua hamburgueria", "hamburgueria"),
    "pizzaria": ("a sua pizzaria", "pizzaria"),
    "restaurante": ("o seu restaurante", "restaurante"),
    "estetica": ("a sua clínica", "clínica odontológica"),
    "ortodontia": ("a sua clínica", "ortodontia"),
    "odontopediatria": ("a sua clínica", "odontopediatria"),
}

TEMPLATE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url('{fonts}/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2') format('woff2');font-weight:100 900}
@font-face{font-family:Serif;font-style:italic;src:url('{fonts}/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2') format('woff2')}
@font-face{font-family:Mono;src:url('{fonts}/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2') format('woff2');font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1080px;overflow:hidden;background:#0b0b0d;color:#f3f2ef;font-family:Archivo,sans-serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(60% 45% at 70% 72%,rgba(77,124,255,.30),transparent 70%),radial-gradient(40% 30% at 10% 0%,rgba(77,124,255,.14),transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,#000 0%,transparent 75%)}
header{position:absolute;top:64px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center}
header img{height:30px}
.tag{font-family:Mono;font-size:17px;letter-spacing:.08em;text-transform:uppercase;color:#9fb6ff;border:1px solid rgba(159,182,255,.35);border-radius:999px;padding:9px 18px}
h1{position:absolute;top:150px;left:72px;right:72px;font-size:76px;line-height:1.02;font-weight:760;letter-spacing:-.035em}
h1 em{font-family:Serif;font-weight:400;font-style:italic;color:#7d9dff;letter-spacing:-.01em;font-size:1.12em}
.laptop{position:absolute;left:72px;top:432px;width:760px;border-radius:18px;background:#1a1a1f;padding:34px 10px 10px;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08)}
.laptop:before{content:"";position:absolute;top:13px;left:16px;width:10px;height:10px;border-radius:50%;background:#ff5f57;box-shadow:17px 0 #febc2e,34px 0 #28c840}
.laptop img{display:block;width:100%;border-radius:8px}
.phone{position:absolute;right:72px;top:396px;width:262px;border-radius:44px;background:#111;padding:11px;box-shadow:0 40px 90px rgba(0,0,0,.7),0 0 0 1.5px rgba(255,255,255,.14)}
.phone img{display:block;width:100%;height:518px;object-fit:cover;object-position:top;border-radius:34px}
footer{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font-family:Mono;font-size:18px;color:#8a8a93;letter-spacing:.02em}
footer b{color:#f3f2ef;font-weight:500}
</style></head><body><div class="glow"></div><div class="grid"></div>
<header><img src="{logo}"><span class="tag">{ramo}</span></header>
<h1>Um site <em>assim</em><br>para {titulo}</h1>
<div class="laptop"><img src="{desk}"></div>
<div class="phone"><img src="{mob}"></div>
<footer><span>Modelo de demonstração · dados de exemplo</span><b>ionext.com.br</b></footer>
</body></html>"""

OUT.mkdir(parents=True, exist_ok=True)
port = REPO / "public/assets/portfolio"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome")
    pg = b.new_page(viewport={"width": 1080, "height": 1080})
    for slug, (titulo, ramo) in MODELOS.items():
        page = (TEMPLATE.replace("{fonts}", FONTS.as_uri())
                .replace("{logo}", (REPO / "public/assets/logo/ionext-wordmark-white.png").as_uri())
                .replace("{desk}", (port / f"{slug}.jpg").as_uri())
                .replace("{mob}", (port / f"{slug}-mobile.jpg").as_uri())
                .replace("{titulo}", html.escape(titulo)).replace("{ramo}", html.escape(ramo)))
        tmp = OUT / f".{slug}.html"
        tmp.write_text(page, encoding="utf-8")
        pg.goto(tmp.as_uri()); pg.wait_for_load_state("networkidle")
        pg.evaluate("document.fonts.ready")
        pg.screenshot(path=str(OUT / f"{slug}.jpg"), type="jpeg", quality=86)
        tmp.unlink()
        print("ok", slug)
    b.close()
