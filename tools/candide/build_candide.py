"""Construit src/content/candide.json (même modèle que La Boîte à merveilles) et les images public/img/cand/
à partir du diaporama « Candide résumé illustré » (raw.json, x/ppt/media, hi/s4-004.png)."""
import json
import os
import re
import sys

from PIL import Image

OUT_JSON, OUT_IMG = sys.argv[1], sys.argv[2]
os.makedirs(OUT_IMG, exist_ok=True)
raw = json.load(open('raw.json'))
S = {s['n']: s for s in raw}
MEDIA = 'x/ppt/media'


def save(src, name, maxw=900, q=78, alpha=False):
    im = Image.open(src if '/' in src else f'{MEDIA}/{src}')
    im = im.convert('RGBA' if alpha else 'RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT_IMG, name), 'WEBP', quality=q, method=6)
    return f'cand/{name}'


def T(n):
    return [x for x in S[n]['shapes'] if 'text' in x and not x['name'].startswith('Slide Number')]


def clean(s):
    return re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()


# ---------- Chapitres ----------
chapters = []
cur = None
for s in raw:
    t = T(s['n'])
    if s['layout'] == 'COUVERTURE':
        head = t[0]['text'][0]
        n, title = re.match(r'Chapitre (\d+) · (.+)', head).groups()
        n = int(n)
        cit = next(x for x in t if x['name'] == 'Citation')['text']
        gravure = next(x for x in s['shapes'] if x['name'].startswith('Gravure'))['img']
        cur = {'n': n, 'title': clean(title), 'cover': save(gravure, f'ch{n:02d}_cover.webp', 860, 62),
               'phrase': clean(cit[0]), 'who': clean(cit[1].lstrip('—').strip()) if len(cit) > 1 else None, 'ideas': []}
        chapters.append(cur)
    elif s['layout'] == 'PAPIER' and t and t[0]['text'][0].startswith('Chapitre'):
        k = len(cur['ideas']) + 1
        idee = next(x for x in t if x['name'].startswith('Idée'))
        duo = [x for x in t if x['text'][0].startswith('À deux')]
        ill = next(x for x in s['shapes'] if x['name'].startswith('Illustration'))['img']
        cur['ideas'].append({'k': k, 'text': clean(' '.join(idee['text'])), 'quote': None,
                             'img': save(ill, f'ch{cur["n"]:02d}_i{k}.webp', 640, 65),
                             'duo': re.sub(r'^À deux\s*:\s*', '', clean(duo[0]['text'][0])) if duo else None})
for c in chapters:
    if c['who']:
        c['phrase'] = f"{c['phrase']} — {c['who']}"
    del c['who']

# ---------- Personnages ----------
chars = []
for n in (2, 3):
    t = T(n)[1:-1]
    portraits = [x for x in S[n]['shapes'] if x['name'].startswith('Portrait')]
    for i in range(0, len(t), 2):
        name, role = clean(t[i]['text'][0]), clean(t[i + 1]['text'][0])
        cid = re.sub(r'[^a-z]', '', name.lower().replace('é', 'e').replace('è', 'e'))
        chars.append({'id': cid, 'name': name, 'role': role, 'img': save(portraits[i // 2]['img'], f'p_{cid}.webp', 480, 70), 'facts': [], 'quote': None})

# ---------- Lieux du voyage ----------
t4 = T(4)
places = []
for x in S[4]['shapes']:
    if 'img' in x and not x['name'].startswith('Titre'):
        name = x['name']
        i = next(k for k, y in enumerate(t4) if clean(y['text'][0]) == name)
        chap = clean(t4[i + 1]['text'][0]).replace('chap. ', '')
        places.append({'name': name, 'img': save(x['img'], 'l_' + re.sub(r'[^a-z]', '', name.lower()) + '.webp', 360, 82, alpha=True), 'chapters': chap})
voyage = save('hi/s4-004.png', 'voyage.webp', 1600, 82)

# ---------- Synthèses (« À retenir ») ----------
def synth(n):
    t = T(n)[1:]
    return [{'t': clean(t[i]['text'][0]), 'd': clean(' '.join(t[i + 1]['text']))} for i in range(0, len(t), 2)]


from quizzes_candide import QUIZZES  # noqa: E402

quiz_slides = {1: 35, 2: 71, 3: 107, 4: 142, 5: 177}
synth_slides = {1: 40, 2: 76, 3: 112, 4: 147, 5: 182}
for q in QUIZZES:
    ill = next(x for x in S[quiz_slides[q['n']]]['shapes'] if x['name'].startswith('Illustration'))['img']
    q['cover'] = save(ill, f'quiz{q["n"]}.webp', 860, 62)
    q['retenir'] = synth(synth_slides[q['n']])

final = T(183)
work = {
    'id': 'candide', 'title': 'Candide ou l’Optimisme', 'shortTitle': 'Candide', 'author': 'Voltaire', 'year': 1759,
    'cover': save(next(x for x in S[1]['shapes'] if x['name'].startswith('Illustration'))['img'], 'cover.webp', 1100),
    'hero': 'cand/ch17_i2.webp',
    'levelLabel': '2e année du baccalauréat',
    'brefTitle': 'Un conte philosophique',
    'lectureLead': 'Découvre les personnages et le grand voyage de Candide, puis lis les trente chapitres et teste-toi avec les cinq quiz.',
    'bref': {'img': 'cand/ch01_i2.webp', 'rows': [
        ['Auteur', 'Voltaire (1694-1778), écrivain et philosophe français des Lumières.'],
        ['Genre', 'Un conte philosophique : une histoire simple et rapide pour faire réfléchir.'],
        ['Publication', '1759.'],
        ['Héros', 'Candide, un jeune homme naïf et gentil, élève du professeur Pangloss.'],
        ['Idée combattue', 'L’optimisme de Pangloss : « Tout est au mieux dans le meilleur des mondes. »'],
        ['Lieux', 'Un grand voyage : Europe, Amérique, Turquie.'],
        ['Structure', '30 chapitres courts. La leçon finale : « Il faut cultiver notre jardin. »'],
    ]},
    'characters': chars,
    'schemas': [{'img': voyage, 't': 'Le grand voyage de Candide', 'alt': 'Le trajet de Candide en 12 étapes : Westphalie, Hollande, Lisbonne, Cadix, Buenos Aires, Paraguay, Eldorado, Surinam, Paris, Portsmouth, Venise, Constantinople.'}],
    'placesTitle': 'Les étapes du voyage',
    'quizTile': 'Vrai ou faux, je retrouve, je classe, je comprends',
    'places': places,
    'chapters': chapters,
    'quizzes': QUIZZES,
    'finale': {'t': clean(final[0]['text'][0].split('·', 1)[1]), 'd': clean(final[1]['text'][0]), 'img': 'cand/ch30_i3.webp'},
}
json.dump(work, open(OUT_JSON, 'w'), ensure_ascii=False, indent=1)
print('chapitres', len(chapters), 'idées', sum(len(c['ideas']) for c in chapters), 'persos', len(chars), 'lieux', len(places))
