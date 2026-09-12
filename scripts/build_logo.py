"""Build header/favicon PNGs from the new TIV logo (white bg, black + copper).
Outputs into public/: tiv-logo-light.png (black letters, for light mode),
tiv-logo-dark.png (bone letters, for dark mode), favicon-64.png, apple-touch-icon.png."""
import os, sys
from PIL import Image

SRC = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "tiv-logo-new.png")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
BONE = (236, 227, 212)
COPPER = (199, 123, 67)

im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.load()

def build(letter_rgb):
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = (r + g + b) / 3
            is_copper = r > 150 and g < 160 and b < 120 and (r - b) > 60
            if is_copper:
                op[x, y] = (*COPPER, 255)
            elif lum < 200:
                # black letters; anti-aliased edge -> alpha from darkness
                a = int(min(255, (255 - lum) * 1.3))
                op[x, y] = (*letter_rgb, a)
            # else: white background -> transparent
    return out

light = build((20, 17, 12))
dark = build(BONE)
# trim to content bbox with a little padding
bbox = dark.getbbox()
pad = 12
box = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad))
light, dark = light.crop(box), dark.crop(box)
light.save(os.path.join(OUT, "tiv-logo-light.png"), optimize=True)
dark.save(os.path.join(OUT, "tiv-logo-dark.png"), optimize=True)

# favicon: dark letters on a navy-ish dark square keeps it visible on any tab bar
def square(img, size, bg):
    cw, ch = img.size
    s = int(size * 0.78)
    scale = s / max(cw, ch)
    small = img.resize((max(1, int(cw*scale)), max(1, int(ch*scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), bg)
    canvas.paste(small, ((size-small.width)//2, (size-small.height)//2), small)
    return canvas
square(dark, 64, (16, 14, 11, 255)).save(os.path.join(OUT, "favicon-64.png"), optimize=True)
square(dark, 180, (16, 14, 11, 255)).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
for f in ("tiv-logo-light.png", "tiv-logo-dark.png", "favicon-64.png", "apple-touch-icon.png"):
    p = os.path.join(OUT, f); print(f, Image.open(p).size, os.path.getsize(p), "bytes")
