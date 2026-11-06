"""Construit src/content/couple.json (modèle « résumé illustré », comme Candide) et les images public/img/vch/
à partir du diaporama « Il était une fois un vieux couple heureux » (raw.json, x/ppt/media).
Les clés de réponse des quiz sont dans quizzes_couple.py (le diaporama ne les marque pas)."""
import json
import os
import re
import sys

from PIL import Image

from quizzes_couple import ANSWERS

OUT_JSON, OUT_IMG = sys.argv[1], sys.argv[2]
os.makedirs(OUT_IMG, exist_ok=True)
raw = json.load(open('raw.json'))
S = {s['n']: s for s in raw}
MEDIA = 'x/ppt/media'


def save(src, name, maxw=900, q=74, alpha=False, frame=False):
    im = Image.open(f'{MEDIA}/{src}')
    im = im.convert('RGBA' if alpha else 'RGB')
    if frame:  # retire le cadre crème « album photo » dessiné autour des illustrations
        m = round(im.width * 0.025)
        im = im.crop((m, m, im.width - m, im.height - m))
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT_IMG, name), 'WEBP', quality=q, method=6)
    return f'vch/{name}'


def clean(s):
    return re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()


def T(n):
    return [x for x in S[n]['shapes'] if 'text' in x and not x['name'].startswith('Slide Number')]


def imgs(n):
    return [x for x in S[n]['shapes'] if 'img' in x]


def head(n):
    t = T(n)
    return clean(t[0]['text'][0]) if t else ''


def framed_jpg(n):
    """Illustration encadrée d'une diapositive (jpg qui n'occupe pas toute la page)."""
    return next(x['img'] for x in imgs(n) if x['img'].endswith('.jpg') and x['w'] < 12000000)


def page_quote(note_line):
    m = re.search(r'\(p\. (\d+)\)\s*:?\s*(«.+?»)\s*\.?$', note_line) or re.search(r'(«.+?»)\s*\(p\. (\d+)\)', note_line)
    if not m:
        return None
    a, b = m.groups()
    p, q = (a, b) if a.isdigit() else (b, a)
    return f'{clean(q)} — p. {p}'


# ---------- L'œuvre en bref ----------
rows = [clean(x) for x in T(2)[1]['text']]
bref = {'img': save(framed_jpg(2), 'bref.webp', 900, 76, frame=True), 'rows': [[rows[i], rows[i + 1]] for i in range(0, len(rows), 2)]}

# ---------- Personnages ----------
chars = []
t3 = T(3)
facts = []
boxes = [x for x in t3 if x['name'] not in ('Text 0', 'Text 1', 'Text 2', 'Text 21')]
for i in range(0, len(boxes), 2):
    facts.append(f"{clean(boxes[i]['text'][0])} : {clean(' '.join(boxes[i + 1]['text']))}")
chars.append({'id': 'bouchaib', 'name': 'Bouchaïb', 'role': clean(t3[2]['text'][0]), 'group': 'couple',
              'img': save(framed_jpg(3), 'p_bouchaib.webp', 480, 74, frame=True), 'facts': facts,
              'quote': clean(t3[-1]['text'][0])})
t4 = T(4)
jp4 = [x['img'] for x in imgs(4) if x['img'].endswith('.jpg')]
chars.append({'id': 'vieille', 'name': 'La vieille', 'role': clean(t4[2]['text'][0]), 'group': 'couple',
              'img': save(jp4[0], 'p_vieille.webp', 480, 74, frame=True), 'facts': [clean(f) for f in t4[4]['text']],
              'quote': clean(t4[3]['text'][0])})
chars.append({'id': 'betes', 'name': 'Les bêtes de la maison', 'role': clean(t4[6]['text'][0]), 'group': 'couple',
              'img': save(jp4[1], 'p_betes.webp', 480, 74, frame=True), 'facts': [clean(f) for f in t4[8]['text']],
              'quote': clean(t4[7]['text'][0])})
for n in (5, 6, 7):
    t = T(n)[1:]
    jp = [x['img'] for x in imgs(n) if x['img'].endswith('.jpg')]
    for k in range(3):
        name = clean(t[2 * k]['text'][0])
        role, *rest = [clean(f) for f in t[2 * k + 1]['text']]
        cid = re.sub(r'[^a-z]', '', name.lower().replace('ï', 'i').replace('è', 'e').replace('é', 'e').replace('’', ''))
        chars.append({'id': cid, 'name': name, 'role': role, 'group': 'autres',
                      'img': save(jp[k], f'p_{cid}.webp', 480, 74, frame=True), 'facts': rest, 'quote': None})

# ---------- Schémas ----------
schemas = [
    {'img': save(imgs(8)[1]['img'], 'relations.webp', 1600, 84), 't': 'Les liens entre les personnages',
     'alt': 'Schéma : Bouchaïb et la vieille au centre ; l’imam publie son poème, Radwane est son ami de toujours, Hmad lui offre du gibier, '
            'il bavarde avec le Mokaddem, il fait ferrer sa mule chez Amzil ; Haj Lahcène sauve la femme d’Amzil ; le Mokaddem prend le fusil d’Oumouh ; '
            'la vieille donne du gibier à Talouqit ; le chat de la maison.'},
    {'img': save(imgs(9)[1]['img'], 'histoire.webp', 1600, 84), 't': 'Quarante ans de changements',
     'alt': 'Frise : avant 1956, le temps des Français (ch. 2 à 4) ; 1956, l’indépendance (ch. 5 et 6) ; 1960, le séisme d’Agadir (ch. 7) ; '
            'années 1970, l’émigration (ch. 8 et 11) ; années 1980, l’argent et la télé (ch. 14 à 23) ; la fin, la sécheresse (ch. 26 et 27).'},
]

# ---------- Lieux ----------
t10 = T(10)[1:]
pl_imgs = [x['img'] for x in imgs(10)[1:]]
places = []
for k in range(len(pl_imgs)):
    name = clean(t10[2 * k]['text'][0])
    chap = clean(t10[2 * k + 1]['text'][0]).replace('ch. ', '')
    slug = re.sub(r'[^a-z]', '', name.lower().replace('’', '').replace('é', 'e'))
    places.append({'name': name, 'img': save(pl_imgs[k], f'l_{slug}.webp', 360, 82, alpha=True), 'chapters': chap})

# ---------- Chapitres ----------
chapters = []
cur = None
for s in raw:
    h = head(s['n'])
    m = re.match(r'Chapitre (\d+) : (.+)', h)
    if m:
        n = int(m.group(1))
        bg = next(x['img'] for x in imgs(s['n']) if x['img'].endswith('.jpg'))
        phrase = page_quote(s['notes'].split('\n')[0])
        cur = {'n': n, 'title': clean(m.group(2)), 'cover': save(bg, f'ch{n:02d}_cover.webp', 1400, 66), 'phrase': phrase, 'ideas': []}
        chapters.append(cur)
        continue
    if re.match(r'Chapitre \d+ · ', h):
        k = len(cur['ideas']) + 1
        t = T(s['n'])
        text = max((x for x in t[1:] if not x['text'][0].startswith(('«', 'À deux'))), key=lambda x: len(' '.join(x['text'])))
        lines = s['notes'].split('\n')
        quote = next((page_quote(l) for l in lines if l.startswith('Idée')), None)
        duo = next((clean(l.split(':', 1)[1]) for l in lines if l.startswith('À deux')), None)
        cur['ideas'].append({'k': k, 'text': clean(' '.join(text['text'])), 'quote': quote,
                             'img': save(framed_jpg(s['n']), f'ch{cur["n"]:02d}_i{k}.webp', 760, 70, frame=True), 'duo': duo})

# ---------- Quiz ----------
LABELS = ['Vrai ou faux ?', 'Choisis la bonne réponse', 'Complète le tableau', 'Pour aller plus loin']
RANGES = [(1, 5), (6, 10), (11, 16), (17, 22), (23, 27)]
quizzes = []
for qi, (c0, c1) in enumerate(RANGES, 1):
    intro = next(s['n'] for s in raw if head(s['n']) == f'Quiz {qi}')
    A = ANSWERS[qi]
    sections = []
    # Niveau 1 : vrai ou faux
    t = [clean(x['text'][0]) for x in T(intro + 1)[1:] if clean(x['text'][0]) not in ('VRAI', 'FAUX')]
    sections.append({'label': LABELS[0], 'title': LABELS[0], 'items': [
        {'type': 'vf', 'q': q, 'a': a, 'ref': list(r)} for q, (a, r) in zip(t, A['vf'], strict=True)]})
    # Niveaux 2 et 4 : QCM
    def qcm(n, keys):
        t = [clean(' '.join(x['text'])) for x in T(n)[1:]]
        out = []
        for j, (a, r) in enumerate(keys):
            q, *opts = t[4 * j:4 * j + 4]
            out.append({'type': 'qcm', 'q': q, 'opts': [re.sub(r'^[abc]\)\s*', '', o) for o in opts], 'a': a, 'ref': list(r)})
        assert len(t) == 4 * len(keys), (n, len(t))
        return out
    sections.append({'label': LABELS[1], 'title': LABELS[1], 'items': qcm(intro + 2, A['n2'])})
    # Niveau 3 : tableau à compléter
    words = [clean(x['text'][0]) for x in T(intro + 3)[2:]]
    assert sorted(words) == sorted(A['sort'].keys()), (qi, set(words) ^ set(A['sort']))
    sections.append({'label': LABELS[2], 'title': 'Complète le tableau : classe chaque mot dans la bonne colonne.', 'type': 'sort',
                     'cats': A['cats'], 'items': [[w, A['sort'][w]] for w in words], 'hint': A.get('hint')})
    sections.append({'label': LABELS[3], 'title': LABELS[3], 'items': qcm(intro + 4, A['n4'])})
    syn = T(intro + 5)
    boxes = [clean(' '.join(x['text'])) for x in syn[1:]]
    retenir = [{'t': boxes[i], 'd': boxes[i + 1]} for i in range(0, len(boxes), 2)]
    bg = next(x['img'] for x in imgs(intro) if x['img'].endswith('.jpg'))
    quizzes.append({'n': qi, 'chapters': list(range(c0, c1 + 1)), 'cover': save(bg, f'quiz{qi}.webp', 1400, 66), 'retenir': retenir, 'sections': sections})

for q in quizzes:
    if q['sections'][2]['hint'] is None:
        del q['sections'][2]['hint']

cover = save(imgs(1)[0]['img'], 'cover.webp', 1600, 72)
D = {
    'id': 'couple',
    'title': 'Il était une fois un vieux couple heureux',
    'shortTitle': 'Le Vieux couple',
    'author': 'Mohammed Khaïr-Eddine',
    'year': 2002,
    'cover': cover,
    'hero': cover,
    'levelLabel': '2e année du baccalauréat',
    'brefTitle': 'Un roman du Sud marocain',
    'lectureLead': 'Découvre Bouchaïb, sa femme et les gens du village, puis lis les vingt-sept chapitres et teste-toi avec les cinq quiz.',
    'bref': bref,
    'bref_alt': 'Le vieux couple sur sa terrasse, au milieu des rochers de l’Anti-Atlas.',
    'groups': [['couple', 'Le vieux couple et sa maison'], ['autres', 'Les autres personnages']],
    'characters': chars,
    'schemas': schemas,
    'placesTitle': 'Les lieux du roman',
    'places': places,
    'chapters': chapters,
    'quizzes': quizzes,
    'finale': {'t': '« Car la vie est partout, même dans le désert le plus aride. »',
               'd': 'La dernière phrase du roman : le Vieux reste au village, il faut creuser plus profond et croire à la vie.',
               'img': chapters[-1]['ideas'][0]['img']},
    'quizTile': 'Vrai ou faux, je choisis, je classe, je vais plus loin',
    'hub': {'lectureImg': chapters[0]['ideas'][1]['img']},
}
json.dump(D, open(OUT_JSON, 'w'), ensure_ascii=False, indent=1)
print(len(chapters), 'chapitres', sum(len(c['ideas']) for c in chapters), 'idées', len(chars), 'personnages', len(places), 'lieux', len(quizzes), 'quiz')
