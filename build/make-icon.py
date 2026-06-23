#!/usr/bin/env python3
"""Draw the Incrust app icon with Pillow and emit a macOS .icns + PNGs."""
import os, subprocess
from PIL import Image, ImageDraw

SS = 4                       # supersample factor for smooth edges
S = 1024 * SS                # master canvas size
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "icon_out"))
os.makedirs(OUT, exist_ok=True)

INK    = (20, 19, 13, 255)   # near-black warm
CREAM  = (236, 233, 225, 255)
YELLOW = (242, 197, 0, 255)

def px(v): return int(round(v * SS))

def rounded(draw, box, r, fill):
    draw.rounded_rectangle([px(box[0]), px(box[1]), px(box[2]), px(box[3])],
                           radius=px(r), fill=fill)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 1. Background squircle with a soft vertical gradient (warm dark).
top, bot = (28, 26, 18), (14, 13, 9)
grad = Image.new("RGBA", (1, S))
gpix = grad.load()
for y in range(S):
    t = y / (S - 1)
    gpix[0, y] = (int(top[0] + (bot[0]-top[0])*t),
                  int(top[1] + (bot[1]-top[1])*t),
                  int(top[2] + (bot[2]-top[2])*t), 255)
grad = grad.resize((S, S))

mask = Image.new("L", (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle([px(96), px(96), px(928), px(928)], radius=px(208), fill=255)
img.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(img)

# 2. Screen panel (cream), upper-centre.
rounded(d, (232, 250, 792, 600), 40, CREAM)

# 3. Cam bubble incrusted at the screen's bottom-left.
cx, cy, rb = 336, 602, 150
gap = 22
# ink halo (the gap that lifts the bubble off the screen)
d.ellipse([px(cx-rb-gap), px(cy-rb-gap), px(cx+rb+gap), px(cy+rb+gap)], fill=INK)
# yellow bubble
d.ellipse([px(cx-rb), px(cy-rb), px(cx+rb), px(cy+rb)], fill=YELLOW)

# 4. Person silhouette (ink) clipped to the bubble.
person = Image.new("RGBA", (S, S), (0, 0, 0, 0))
pd = ImageDraw.Draw(person)
hr = 46
pd.ellipse([px(cx-hr), px(cy-58-hr), px(cx+hr), px(cy-58+hr)], fill=INK)   # head
pd.ellipse([px(cx-104), px(cy+8), px(cx+104), px(cy+230)], fill=INK)       # shoulders
bubble_mask = Image.new("L", (S, S), 0)
bd = ImageDraw.Draw(bubble_mask)
bd.ellipse([px(cx-rb), px(cy-rb), px(cx+rb), px(cy+rb)], fill=255)
img.paste(person, (0, 0), Image.composite(person.split()[3], Image.new("L", (S, S), 0), bubble_mask))

# Downscale master → 1024 and build the iconset.
master = img.resize((1024, 1024), Image.LANCZOS)
master.save(os.path.join(OUT, "icon_1024.png"))
master.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "icon_512.png"))

iconset = os.path.join(OUT, "icon.iconset")
os.makedirs(iconset, exist_ok=True)
sizes = [16, 32, 64, 128, 256, 512, 1024]
for s in sizes:
    master.resize((s, s), Image.LANCZOS).save(os.path.join(iconset, f"_{s}.png"))
def link(name, s):
    src = os.path.join(iconset, f"_{s}.png")
    Image.open(src).save(os.path.join(iconset, name))
link("icon_16x16.png", 16);   link("icon_16x16@2x.png", 32)
link("icon_32x32.png", 32);   link("icon_32x32@2x.png", 64)
link("icon_128x128.png", 128);link("icon_128x128@2x.png", 256)
link("icon_256x256.png", 256);link("icon_256x256@2x.png", 512)
link("icon_512x512.png", 512);link("icon_512x512@2x.png", 1024)
for s in sizes:
    os.remove(os.path.join(iconset, f"_{s}.png"))

print("iconset ready:", iconset)
