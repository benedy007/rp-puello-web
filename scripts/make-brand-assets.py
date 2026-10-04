"""Genera logo, favicon, íconos y tarjetas sociales de RP Puello & Asociados.

Uso: python3 scripts/make-brand-assets.py  (requiere Pillow con WebP)
Fuente: brand/logo-original.jpg (1024x1024, insignia redonda sobre esquinas negras).
"""
import base64
import io
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "brand" / "logo-original.jpg"
PUB = ROOT / "public"

src = Image.open(SRC).convert("RGB")
W, H = src.size

# 1) Detectar el círculo: píxeles claramente no negros (el aro rojo exterior).
px = src.load()
xs, ys = [], []
for y in range(0, H, 2):
    for x in range(0, W, 2):
        r, g, b = px[x, y]
        if max(r, g, b) > 90:
            xs.append(x)
            ys.append(y)
left, right, top, bottom = min(xs), max(xs), min(ys), max(ys)
cx, cy = (left + right) / 2, (top + bottom) / 2
radius = min(right - left, bottom - top) / 2 - 2  # 2 px hacia dentro: sin borde oscuro
print(f"círculo: centro=({cx:.1f},{cy:.1f}) radio={radius:.1f}")

# 2) Recortar al círculo con fondo transparente (máscara suavizada a 4x).
box = (round(cx - radius), round(cy - radius), round(cx + radius), round(cy + radius))
crop = src.crop(box).convert("RGBA")
size = crop.size[0]
SS = 4
mask = Image.new("L", (size * SS, size * SS), 0)
ImageDraw.Draw(mask).ellipse((0, 0, size * SS - 1, size * SS - 1), fill=255)
mask = mask.resize((size, size), Image.LANCZOS)
crop.putalpha(mask)
badge = crop  # RGBA cuadrado, transparente fuera del círculo


def resized(img, n):
    return img.resize((n, n), Image.LANCZOS)


# 3) Logo del encabezado/pie: WebP con transparencia (64/128/192).
for n in (64, 128, 192):
    resized(badge, n).save(PUB / "images" / f"logo-{n}.webp", "WEBP", quality=88, method=6)

# 4) Favicon PNG 256 (insignia recortada, transparente), cuantizado para pesar poco.
fav = resized(badge, 256)
fav.quantize(colors=128, method=Image.Quantize.FASTOCTREE).save(PUB / "favicon.png", optimize=True)

# favicon.svg: misma insignia (64 px) embebida, por si alguna herramienta lo pide.
buf = io.BytesIO()
resized(badge, 64).save(buf, "PNG", optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
(PUB / "favicon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
    'viewBox="0 0 64 64"><title>RP Puello &amp; Asociados</title>'
    f'<image width="64" height="64" href="data:image/png;base64,{b64}"/></svg>\n'
)

# 5) Apple touch icon 180: iOS no respeta transparencia, así que va sobre negro
#    (como el logo original) con un pequeño margen.
icon = Image.new("RGBA", (180, 180), (0, 0, 0, 255))
inner = resized(badge, 172)
icon.alpha_composite(inner, (4, 4))
icon.convert("RGB").quantize(colors=128, method=Image.Quantize.MEDIANCUT).save(
    PUB / "__grok" / "icon-180.png", optimize=True
)

# 6) Tarjetas sociales: fondo negro, franja roja de marca arriba y abajo, insignia centrada.
RED = (200, 16, 46)
BLACK = (22, 19, 20)


def card(w, h, logo_px, band):
    im = Image.new("RGB", (w, h), BLACK)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, band - 1), fill=RED)
    d.rectangle((0, h - band, w, h), fill=RED)
    lg = resized(badge, logo_px)
    im.paste(lg, ((w - logo_px) // 2, (h - logo_px) // 2), lg)
    return im


card(1200, 630, 540, 12).save(PUB / "og.jpg", "JPEG", quality=84, optimize=True, progressive=True)
card(1200, 264, 228, 8).save(PUB / "x-banner.jpg", "JPEG", quality=84, optimize=True, progressive=True)

for p in [
    PUB / "images/logo-64.webp",
    PUB / "images/logo-128.webp",
    PUB / "images/logo-192.webp",
    PUB / "favicon.png",
    PUB / "favicon.svg",
    PUB / "__grok/icon-180.png",
    PUB / "og.jpg",
    PUB / "x-banner.jpg",
]:
    print(f"{p.relative_to(ROOT)}: {p.stat().st_size / 1024:.1f} KB")
