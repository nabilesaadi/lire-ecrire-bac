"""Construit src/content/djc.json et les images public/img/djc/ à partir du diaporama
« Le Dernier Jour d'un condamné » (raw.json, x/ppt/media)."""
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


def save(src, name, maxw=1000, q=78):
    im = Image.open(f'{MEDIA}/{src}').convert('RGB')
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT_IMG, name), 'WEBP', quality=q, method=6)
    return f'djc/{name}'


def T(n):
    return [x for x in S[n]['shapes'] if 'text' in x and not x['name'].startswith('Slide Number')]


def imgs(n):
    return [x for x in S[n]['shapes'] if 'img' in x and x['img'].endswith('.jpg')]


def txt(x):
    return ' '.join(x['text'])


ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50}


def roman(s):
    v, prev = 0, 0
    for ch in reversed(s):
        c = ROMAN[ch]
        v = v - c if c < prev else v + c
        prev = max(prev, c)
    return v


# ---------- Pages « chapitre » ----------
def chapter(n):
    sh = T(n)
    k = re.sub(r'\s+', ' ', sh[0]['text'][0]).replace(' · ', ' · ')
    title = next(x for x in sh if x['name'] == 'Text 0')['text'][0]
    res = next(x for x in sh if 'resume' in x['name'])
    # zone d'en-tête (lieu + moment) à droite du titre
    head = [x for x in sh if x['y'] < 200 * 6858 and x['x'] > 600 * 12192 and x['name'] != 'Text 0']
    head.sort(key=lambda x: x['y'])
    chips = [txt(x) for x in head]
    # citation : texte entre le guillemet et la page ; la page = « p. N »
    after = [x for x in sh if x['y'] > res['y'] and x['name'] not in ('Text 0',) and txt(x) not in ('«', 'À DEUX', 'BICÊTRE', 'CONCIERGERIE', 'GRÈVE')]
    page = next((txt(x) for x in after if re.fullmatch(r'p\. \d+', txt(x))), None)
    pair_lbl = next((x for x in sh if txt(x) == 'À DEUX'), None)
    pair = None
    if pair_lbl:
        pair = next(txt(x) for x in sh if x['y'] > pair_lbl['y'] and x['y'] < pair_lbl['y'] + 120 * 6858 and txt(x) != 'À DEUX')
    quote = next((txt(x) for x in after if not re.fullmatch(r'p\. \d+', txt(x)) and txt(x) != pair), None)
    num = roman(k.split()[1])
    big = max(imgs(n), key=lambda x: x['w'] * x['h'])
    p = {'type': 'frame', 'slide': n, 'k': k, 't': title, 'chips': chips, 'lines': [txt(res)],
         'img': save(big['img'], f'c{n}.webp', 900), 'photo': True, 'ch': num}
    if quote:
        p['quote'] = {'t': quote, 'p': page}
    if pair:
        p['pair'] = pair
    return p


# ---------- Pages d'introduction ----------
def s3():
    sh = T(3)
    lines = [txt(sh[2]), txt(sh[3])]
    dates = sh[4:]
    steps = [{'t': txt(dates[i]), 'd': txt(dates[i + 1])} for i in range(0, len(dates), 2)]
    return {'type': 'steps', 'slide': 3, 'k': 'L’AUTEUR', 't': txt(sh[1]), 'intro': lines, 'steps': steps, 'timeline': True}


def s4():
    sh = T(4)
    stats = [{'t': txt(sh[i]), 'd': txt(sh[i + 1])} for i in range(1, 9, 2)]
    return {'type': 'cards', 'slide': 4, 't': txt(sh[0]), 'cards': stats, 'stats': True,
            'intro': [txt(sh[9]), txt(sh[10])], 'box': {'l': 'Aujourd’hui', 't': txt(sh[11])}}


def s5():
    sh = T(5)
    cards = [{'n': txt(sh[i]), 't': txt(sh[i + 1]), 'd': txt(sh[i + 2])} for i in range(1, 13, 3)]
    q = txt(sh[13])
    m = re.match(r'«\s*(.*?)\s*»\s*(chap\..*)$', q)
    return {'type': 'cards', 'slide': 5, 't': txt(sh[0]), 'cards': cards, 'quote': {'t': m.group(1), 'p': m.group(2)}}


def s6():
    sh = T(6)
    rows = [[txt(sh[i]).capitalize(), txt(sh[i + 1])] for i in range(3, 15, 2)]
    return {'type': 'frame', 'slide': 6, 'k': txt(sh[0]), 't': txt(sh[1]), 'sub': txt(sh[2]), 'lines': [], 'rows': rows,
            'img': save(imgs(6)[0]['img'], 'p6.webp', 800), 'tall': True,
            'quote': {'t': txt(sh[16]), 'p': txt(sh[17])}}


def people(n):
    sh = T(n)
    ims = imgs(n)
    cards = []
    for i in range(3):
        name, role, desc, quote = (txt(x) for x in sh[2 + i * 4: 6 + i * 4])
        m = re.match(r'«\s*(.*?)\s*»\s*(p\. \d+)$', quote)
        cards.append({'t': name, 'k': role, 'd': desc, 'img': save(ims[i]['img'], f'v{n}_{i}.webp', 600),
                      'quote': {'t': m.group(1), 'p': m.group(2)}})
    return {'type': 'cards', 'slide': n, 'k': txt(sh[0]).split(' · ')[0], 't': txt(sh[1]), 'cards': cards, 'people': True}


def s9():
    sh = [x for x in T(9) if txt(x) != '→']
    ims = imgs(9)
    cards = []
    for i in range(3):
        nn, name, where, d = (txt(x) for x in sh[1 + i * 4: 5 + i * 4])
        cards.append({'n': nn, 't': name, 'k': where, 'd': d, 'img': save(ims[i]['img'], f'v9_{i}.webp', 700)})
    q = txt(sh[-1])
    m = re.match(r'«\s*(.*?)\s*»\s*(chap\..*)$', q)
    return {'type': 'cards', 'slide': 9, 't': txt(sh[0]), 'cards': cards, 'places': True, 'quote': {'t': m.group(1), 'p': m.group(2)}}


def s10():
    sh = T(10)
    items = sh[1:-1]
    steps = [{'n': txt(items[i]), 't': txt(items[i + 1]), 'sub': txt(items[i + 2])} for i in range(0, len(items), 3)]
    return {'type': 'steps', 'slide': 10, 't': txt(sh[0]), 'steps': steps, 'clock': True, 'box': {'l': 'Retiens', 't': txt(sh[-1])}}


def synth(n, t=None):
    sh = T(n)
    cards = [{'n': txt(sh[i]), 't': txt(sh[i + 1]), 'd': txt(sh[i + 2])} for i in range(2, len(sh), 3)]
    return {'type': 'cards', 'slide': n, 'k': txt(sh[0]), 't': t or txt(sh[1]), 'cards': cards, 'numbered': True}


def s88():
    sh = T(88)
    qs = [{'l': txt(sh[i]).capitalize(), 'q': txt(sh[i + 1])} for i in range(3, len(sh), 2)]
    return {'type': 'discuss', 'slide': 88, 't': txt(sh[1]), 'sub': txt(sh[2]), 'qs': qs, 'img': save(imgs(88)[0]['img'], 'p88.webp', 700)}


def s89():
    sh = T(89)
    i_reg = next(i for i, x in enumerate(sh) if txt(x) == 'LES REGISTRES')
    th = sh[3:i_reg]
    rg = sh[i_reg + 1:]
    return {'type': 'cards', 'slide': 89, 'k': 'SYNTHÈSE', 't': txt(sh[1]), 'groups': [
        {'t': 'Les thèmes', 'cards': [{'t': txt(th[i]), 'd': txt(th[i + 1])} for i in range(0, len(th), 2)]},
        {'t': 'Les registres', 'cards': [{'t': txt(rg[i]), 'd': txt(rg[i + 1])} for i in range(0, len(rg), 2)]},
    ]}


def s90():
    sh = T(90)
    pts = [txt(sh[i]) for i in range(4, len(sh), 2)]
    return {'type': 'frame', 'slide': 90, 'k': 'SYNTHÈSE', 't': txt(sh[1]), 'sub': txt(sh[2]), 'lines': pts, 'numbered': True,
            'img': save(imgs(90)[0]['img'], 'p90.webp', 900), 'photo': True}


def s91():
    sh = T(91)
    return {'type': 'frame', 'slide': 91, 'k': None, 't': txt(sh[0]), 'lines': [txt(sh[1])], 'sub': txt(sh[2]),
            'img': save(imgs(91)[0]['img'], 'p91.webp', 1200), 'wide': True}


def divider(n):
    sh = T(n)
    return {'etape': f"{txt(sh[0]).capitalize().replace('Partie iii', 'Partie III').replace('Partie ii', 'Partie II').replace('Partie i', 'Partie I')} · {txt(sh[1])}",
            'time': txt(sh[2]), 'lead': txt(sh[3]), 'cover': save(imgs(n)[0]['img'], f'bg{n}.webp', 1400, 74)}


def chs(a, b):
    return [chapter(n) for n in range(a, b + 1)]


units = []
cover = save(imgs(1)[0]['img'], 'cover.webp', 800)
units.append({'n': 1, 'letter': '', 'etape': 'Avant de lire', 'tag': 'AVANT DE LIRE', 't': 'L’auteur, l’œuvre et les personnages', 'short': 'L’auteur et l’œuvre',
              'lead': 'Qui est Victor Hugo ? Pourquoi ce roman ? Qui sont les personnages, où et quand se passe l’histoire ?',
              'cover': save(imgs(2)[0]['img'], 'u1.webp', 1200), 'pages': [s3(), s4(), s5(), s6(), people(7), people(8), s9(), s10()]})
d1, d2, d3 = divider(11), divider(44), divider(81)
P1 = [(1, 'La condamnation', 12, 19), (2, 'Écrire dans le cachot', 20, 27), (3, 'Les forçats et l’infirmerie', 28, 35), (4, 'Le dernier matin', 36, 40)]
P2 = [(1, 'Le voyage et le friauche', 45, 52), (2, 'La matinée à la Conciergerie', 53, 62), (3, 'Une heure de l’après-midi', 63, 70), (4, 'Marie', 71, 78)]
n = 2
for div, plist, letter, synth_n in [(d1, P1, 'I', 43), (d2, P2, 'II', 80)]:
    for k, title, a, b in plist:
        pages = chs(a, b)
        first, last = pages[0]['ch'], pages[-1]['ch']
        if k == len(plist):
            pages.append(synth(synth_n))
        u = {'n': n, 'letter': letter, 'etape': div['etape'], 'tag': f"PARTIE {letter} · CHAPITRES {first} À {last}", 't': title, 'short': title,
             'lead': (f"{div['time']}. {div['lead']}" if k == 1 else f"Chapitres {first} à {last}."), 'cover': div['cover'] if k == 1 else pages[0]['img'],
             'pages': pages}
        units.append(u)
        n += 1
pages = chs(82, 86)
units.append({'n': n, 'letter': 'III', 'etape': d3['etape'], 'tag': 'PARTIE III · CHAPITRES 48 ET 49', 't': 'La toilette, la charrette, quatre heures', 'short': 'La place de Grève',
              'lead': f"{d3['time']}. {d3['lead']}", 'cover': d3['cover'], 'pages': pages})
n += 1
units.append({'n': n, 'letter': '', 'etape': 'Synthèse', 'tag': 'SYNTHÈSE', 't': 'Thèmes, registres et thèse', 'short': 'Synthèse',
              'lead': 'Ce qu’il faut retenir du roman, la thèse de Victor Hugo et des questions pour réfléchir, débattre et écrire.',
              'cover': 'djc/p91.webp', 'pages': [s89(), s90(), s88(), s91()]})

chars = []
p6 = units[0]['pages'][3]
chars.append({'id': 'condamne', 'name': 'Le condamné', 'role': p6['sub'], 'facts': [], 'rows': p6['rows'], 'img': p6['img'], 'quote': p6['quote']})
for pg in units[0]['pages'][4:6]:
    for c in pg['cards']:
        chars.append({'id': re.sub(r'[^a-z]', '', c['t'].lower()), 'name': c['t'], 'role': c['k'].capitalize(), 'facts': [c['d']], 'img': c['img'], 'quote': c['quote']})

# ---------- Chapitre → (étape, page) pour les renvois des quiz ----------
where = {}
for u in units:
    for i, p in enumerate(u['pages'], 1):
        if 'ch' in p and p['ch'] not in where:
            where[p['ch']] = [u['n'], i]


def R(ch, part=1):
    u, i = where[ch]
    return [u, i + part - 1]


from quizzes_djc import build_quizzes  # noqa: E402

for k, x in enumerate(imgs(87)):
    save(x['img'], f'o{k}.webp', 500)

work = {
    'id': 'djc', 'title': 'Le Dernier Jour d’un condamné', 'author': 'Victor Hugo', 'year': 1829,
    'cover': cover, 'hero': d1['cover'],
    'tagline': txt(T(1)[3]),
    'brefTitle': 'Un plaidoyer contre la peine de mort',
    'lectureLead': 'Découvre l’auteur et les personnages, puis suis le condamné de Bicêtre à la place de Grève, chapitre par chapitre. Teste-toi avec les quiz.',
    'pathTitle': 'Les 3 parties, les 49 chapitres et les 3 quiz', 'pathH2': 'Lis partie par partie',
    'hub': {'lecture': {'img': 'djc/c45.webp', 'd': 'Les 49 chapitres en images, de Bicêtre à la place de Grève, avec une question « À deux » par chapitre, puis 3 quiz.'},
            'extra': {'unit': n, 'img': 'djc/p90.webp', 't': 'La thèse de Victor Hugo', 'd': 'Thèmes, registres, les quatre arguments contre la peine de mort et cinq questions pour réfléchir et écrire.', 'tag': 'Synthèse'}},
    'bref': {'img': cover, 'rows': [
        ['Auteur', 'Victor Hugo (1802-1885), poète, romancier et dramaturge, chef du mouvement romantique.'],
        ['Genre', 'Un roman à thèse écrit comme un journal intime, à la première personne.'],
        ['Publication', 'Février 1829, chez Charles Gosselin, sans nom d’auteur. Préface signée en 1832.'],
        ['Narrateur', 'Un condamné à mort : nous ne connaissons ni son nom ni son crime.'],
        ['Lieux', 'Bicêtre, la Conciergerie, la place de Grève, à Paris.'],
        ['Temps', 'Six semaines d’attente, puis un dernier jour, heure par heure, jusqu’à « QUATRE HEURES ».'],
        ['Thèse', 'La peine de mort est une torture morale, injuste et inutile.'],
    ]},
    'units': units, 'characters': chars,
}
work['quizzes'] = build_quizzes(R, units)
json.dump(work, open(OUT_JSON, 'w'), ensure_ascii=False, indent=1)
print('units', len(units), 'pages', sum(len(u['pages']) for u in units), 'chars', len(chars))
for u in units:
    print(u['n'], u['etape'], '|', u['t'], len(u['pages']), u['cover'])
