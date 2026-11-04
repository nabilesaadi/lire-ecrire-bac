"""Convertit les images du diaporama Antigone en webp pour le site (public/img/ant/)."""
import json
import os
import sys
from PIL import Image

SRC = 'x/ppt/media'
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
raw = json.load(open('raw.json'))
S = {s['n']: s for s in raw}
EMU_W, EMU_H = 9144000, 5143500


def save(im, name, maxw, q=78):
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)


def pics(n):
    return [x for x in S[n]['shapes'] if 'img' in x]


made = []
# Fonds plein cadre (diapositives « cinéma », intercalaires, couverture)
for n in [1, 3, 5, 9, 13, 16, 32, 39, 52, 55, 73, 76, 80, 81, 83, 91]:
    save(Image.open(f"{SRC}/{S[n]['bg']}"), f'bg{n}.webp', 1400, 74)
    made.append(f'bg{n}.webp')
# Images principales des diapositives « cadre » (carrées)
for s in raw:
    big = [x for x in pics(s['n']) if x['w'] >= 4000000]
    if big and s['n'] not in (4,):
        save(Image.open(f"{SRC}/{big[0]['img']}"), f"p{s['n']}.webp", 900)
        made.append(f"p{s['n']}.webp")
# Couverture (portrait d'Antigone)
save(Image.open(f"{SRC}/{pics(1)[0]['img']}"), 'cover.webp', 900)
# Vignettes et portraits des diapositives à cartes
for n in (7, 30, 84, 88):
    for k, x in enumerate(pics(n)):
        save(Image.open(f"{SRC}/{x['img']}"), f'v{n}_{k}.webp', 420, 76)
        made.append(f'v{n}_{k}.webp')
# Icônes (claires sur fond transparent) : gardées en webp avec transparence
for n in (6, 8, 33, 36, 85, 86):
    for k, x in enumerate(pics(n)):
        im = Image.open(f"{SRC}/{x['img']}").convert('RGBA').resize((96, 96), Image.LANCZOS)
        im.save(os.path.join(OUT, f'ic{n}_{k}.webp'), 'WEBP', quality=90, lossless=True)
        made.append(f'ic{n}_{k}.webp')


# Schémas : rendus de diapositives entières ou recadrés
def crop(n, box):
    im = Image.open(f'hi/s{n}-{n:02d}.png') if n < 10 else Image.open(f'hi/s{n}-{n}.png')
    W, H = im.size
    x0, y0, x1, y1 = box
    return im.crop((round(x0 / EMU_W * W), round(y0 / EMU_H * H), round(x1 / EMU_W * W), round(y1 / EMU_H * H)))


save(crop(4, (4663440, 420624, 8778240, 4535424)), 'fig4.webp', 1000, 82)
save(crop(38, (365760, 420624, 4480560, 4535424)), 'fig38.webp', 1000, 82)
save(crop(17, (0, 950000, EMU_W, 4330000)), 'fig17.webp', 1600, 82)
save(crop(50, (0, 800000, EMU_W, 4760000)), 'fig50.webp', 1600, 82)
print(len(made) + 5, 'images')
