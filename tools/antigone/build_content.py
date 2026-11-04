"""Construit src/content/antigone.json à partir du diaporama (raw.json) et des choix de structure ci-dessous."""
import json
import re
import sys

raw = json.load(open('raw.json'))
S = {s['n']: s for s in raw}
CINE = {5, 9, 13, 55, 73, 76, 80, 81}


def shapes(n):
    return [x for x in S[n]['shapes'] if 'text' in x and not x['name'].startswith('Slide Number')]


def named(n, prefix):
    return [x for x in shapes(n) if x['name'].startswith(prefix)]


def one(n, prefix):
    r = named(n, prefix)
    return r[0]['text'] if r else None


def kicker(n):
    k = one(n, 'Étiquette')
    if not k:
        return None
    k = k[0]
    if not k.startswith('TEMPS'):
        k = re.sub(r'\s*·\s*\d+\s*/\s*\d+$', '', k)
    return k


def note(n):
    t = (S[n]['notes'] or '').strip()
    return re.sub(r'^Pour la classe\s*—\s*', '', t)


def cap(s):
    return s[:1].upper() + s[1:]


def ask_from_note(n):
    t = note(n)
    if not t.startswith('Question :'):
        return None
    t = t[len('Question :'):].strip()
    m = re.match(r'^(.*?\?)\s*\((.*)\)\s*$', t)
    if m:
        return [{'q': cap(m.group(1)), 'a': m.group(2)}]
    return [{'q': cap(t)}]


def box(n):
    b = named(n, 'Encadré')
    if not b:
        return None
    tx = b[0]['text']
    return {'l': cap(tx[0].lower()), 't': ' '.join(tx[1:])}


def frame(n, img=None, extra=None):
    t0 = named(n, 'Text 0')
    p = {'type': 'frame', 'slide': n, 'k': kicker(n), 't': t0[0]['text'][0], 'lines': t0[1]['text'] if len(t0) > 1 else []}
    sub = one(n, 'Sous-titre')
    if sub:
        p['sub'] = sub[0]
    p['img'] = img or (f'bg{n}.webp' if n in CINE else f'p{n}.webp')
    p['wide'] = n in CINE
    b = box(n)
    if b:
        p['box'] = b
    a = ask_from_note(n)
    if a:
        p['ask'] = a
    if extra:
        p.update(extra)
    return p


def title(n):
    return named(n, 'Text 0')[0]['text'][0]


def cards_titled(n, icons=None, prefix_t='Titre carte', prefix_d='Texte carte'):
    ts, ds = named(n, prefix_t), named(n, prefix_d)
    out = []
    for i, (a, b) in enumerate(zip(ts, ds)):
        c = {'t': a['text'][0], 'd': ' '.join(b['text'])}
        if icons:
            c['icon'] = f'ic{n}_{i}.webp'
        out.append(c)
    return out


def info(n):
    return note(n)


# ---------- Étape 1 : la Grèce antique ----------
def s4():
    p = frame(4, img='fig4.webp')
    p['legend'] = one(4, 'Légende de la carte')
    p['k'] = 'GRÈCE ANTIQUE'
    p['t'] = title(4)
    p['lines'] = named(4, 'Text 0')[1]['text']
    p['square'] = True
    p['info'] = 'Sur la carte, les pointillés montrent le chemin d’Œdipe : Delphes → carrefour → Thèbes. De Delphes à Thèbes : environ 75 km à vol d’oiseau.'
    return p


def s6():
    return {'type': 'cards', 'slide': 6, 't': title(6), 'cards': cards_titled(6, icons=True),
            'ask': [{'q': 'Compare avec notre vie : qu’est-ce qui est pareil, qu’est-ce qui change ?'}]}


def s7():
    sh = shapes(7)
    texts = [x['text'][0] for x in sh[1:]]
    cards = []
    for i in range(4):
        who, what, desc = texts[i * 3:(i + 1) * 3]
        cards.append({'k': who, 't': what, 'd': desc, 'img': f'v7_{i}.webp'})
    return {'type': 'cards', 'slide': 7, 't': title(7), 'cards': cards, 'portraits': True, 'info': info(7)}


def s8():
    return {'type': 'cards', 'slide': 8, 't': title(8), 'cards': cards_titled(8, icons=True), 'info': info(8)}


def s10():
    sh = shapes(10)
    steps = []
    tx = [x['text'] for x in sh[1:]]
    # pastille, titre, texte ×3
    for i in range(3):
        steps.append({'n': tx[i * 3][0], 't': tx[i * 3 + 1][0], 'd': tx[i * 3 + 2][0]})
    return {'type': 'steps', 'slide': 10, 't': title(10), 'steps': steps, 'box': box(10), 'arrows': True}


def s15():
    sh = shapes(15)[1:]
    cards = [{'t': sh[i]['text'][0], 'd': ' '.join(sh[i + 1]['text'])} for i in range(0, len(sh), 2)]
    return {'type': 'cards', 'slide': 15, 't': title(15), 'cards': cards, 'glossary': True}


# ---------- Étape 2 : Œdipe ----------
def s17():
    return {'type': 'figure', 'slide': 17, 't': title(17), 'img': 'fig17.webp',
            'alt': 'Arbre de la famille : Laïos et Jocaste sont les parents d’Œdipe ; Créon est le frère de Jocaste et le mari d’Eurydice ; Œdipe et Jocaste ont quatre enfants : Étéocle, Polynice, Ismène et Antigone ; Hémon, fils de Créon, est le fiancé d’Antigone.',
            'lines': ['Laïos (roi de Thèbes) et Jocaste (reine de Thèbes) sont les parents d’Œdipe.',
                      'Créon est le frère de Jocaste. Sa femme s’appelle Eurydice, leur fils Hémon.',
                      one(17, 'Légende famille')[0] + ' Étéocle, Polynice, Ismène et Antigone.',
                      'Antigone et Hémon sont fiancés.'],
            'box': box(17),
            'ask': [{'q': 'Qui est l’oncle d’Antigone ?', 'a': 'Créon.'}, {'q': 'Qui est son fiancé ?', 'a': 'Hémon, son cousin.'}]}


def s30():
    caps = [x['text'][0] for x in named(30, 'Légende')]
    return {'type': 'gallery', 'slide': 30, 't': title(30), 'items': [{'img': f'v30_{i}.webp', 't': c, 'n': i + 1} for i, c in enumerate(caps)],
            'ask': [{'q': 'Raconte l’histoire d’Œdipe en t’aidant seulement de ces 10 images.'}]}


# ---------- Étape 3 : Anouilh ----------
def s33():
    return {'type': 'cards', 'slide': 33, 't': title(33), 'cards': cards_titled(33, icons=True)}


def s34():
    dates = [x for x in shapes(34) if x['name'].startswith('Texte ') and x['name'] != 'Texte']
    steps = [{'t': x['text'][0], 'd': ' '.join(x['text'][1:])} for x in dates]
    order = ['1939', '1940', 'Février 1944', 'Août 1944', '1945']
    steps.sort(key=lambda s: order.index(s['t']))
    return {'type': 'steps', 'slide': 34, 't': title(34), 'steps': steps, 'timeline': True, 'box': box(34), 'info': info(34)}


def s35():
    sh = shapes(35)
    rows = []
    labels = [x['text'][0] for x in sh if x['name'].startswith('Ligne')]
    vals = [x['text'][0] for x in sh if x['name'].startswith('Texte')]
    for i, l in enumerate(labels):
        rows.append([l, vals[i * 2], vals[i * 2 + 1]])
    return {'type': 'compare', 'slide': 35, 't': title(35), 'cols': ['Sophocle', 'Anouilh'], 'rows': rows, 'info': info(35)}


def s36():
    return {'type': 'cards', 'slide': 36, 't': title(36), 'cards': cards_titled(36, icons=True), 'info': info(36)}


def s37():
    sh = shapes(37)
    hrs = [x['text'][0] for x in sh if x['name'].startswith('Heure')]
    mom = [x['text'][0] for x in sh if x['name'].startswith('Moment')]
    ev = [x['text'][0] for x in sh if x['name'].startswith('Événement')]
    steps = [{'n': h, 't': m, 'd': e} for h, m, e in zip(hrs, mom, ev)]
    return {'type': 'steps', 'slide': 37, 't': title(37), 'steps': steps, 'box': box(37), 'arrows': True,
            'ask': [{'q': 'Quelle heure est-il quand Antigone est arrêtée ?', 'a': 'Midi.'}, {'q': 'Quand finit la pièce ?', 'a': 'Cinq heures.'}]}


def s38():
    p = frame(38, img='fig38.webp')
    p['square'] = True
    p['ask'] = [{'q': 'Comment faire sentir un palais avec seulement trois portes ?', 'a': 'Par la lumière, les bruits, les mots.'}]
    return p


# ---------- Étape 4 : personnages ----------
CHAR_IDS = {40: 'antigone', 41: 'ismene', 42: 'creon', 43: 'hemon', 44: 'eurydice', 45: 'nourrice', 46: 'garde', 47: 'messager', 48: 'page', 49: 'choeur'}


def char_page(n):
    p = frame(n)
    p['k'] = 'PERSONNAGE'
    p['word'] = p.pop('box')['t']
    p['char'] = CHAR_IDS[n]
    return p


def s50():
    return {'type': 'figure', 'slide': 50, 't': title(50), 'img': 'fig50.webp',
            'alt': 'Schéma des liens : Créon et Eurydice sont mariés ; Hémon est leur fils ; le Page est le petit page de Créon ; Créon est l’oncle d’Antigone ; Hémon et Antigone sont fiancés ; Antigone et Ismène sont sœurs ; la Nourrice les a élevées.',
            'lines': ['Créon et Eurydice sont mariés. Hémon est leur fils.', 'Le Page est le petit page de Créon.',
                      'Créon est l’oncle d’Antigone (et d’Ismène).', 'Hémon et Antigone sont fiancés.',
                      'Antigone et Ismène sont sœurs. La Nourrice les a élevées.']}


# ---------- Étape 5 : scènes ----------
def s53():
    sh = shapes(53)[1:]
    tx = [x['text'] for x in sh]
    steps = []
    for i in range(4):
        n_, t_, sc, d_ = tx[i * 4:(i + 1) * 4]
        steps.append({'n': n_[0], 't': t_[0], 'sub': sc[0], 'd': d_[0], 'unit': 5 + i})
    return {'type': 'steps', 'slide': 53, 't': title(53), 'steps': steps, 'box': box(53)}


# ---------- Étape 6 : comprendre ----------
def s84():
    sh = shapes(84)[1:]
    cols = [{'t': sh[0]['text'][0], 'img': 'v84_0.webp', 'lines': sh[1]['text']},
            {'t': sh[2]['text'][0], 'img': 'v84_1.webp', 'lines': sh[3]['text']}]
    return {'type': 'duo', 'slide': 84, 't': title(84), 'cols': cols,
            'tip': 'Il n’y a pas de bonne réponse unique : Anouilh donne de bons arguments aux deux.'}


def s85():
    sh = shapes(85)[1:]
    cards = [{'t': sh[i]['text'][0], 'd': ' '.join(sh[i + 1]['text']), 'icon': f'ic85_{i // 2}.webp'} for i in range(0, len(sh), 2)]
    return {'type': 'cards', 'slide': 85, 't': title(85), 'cards': cards}


def s86():
    sh = shapes(86)[1:]
    cards = [{'t': sh[i]['text'][0], 'd': ' '.join(sh[i + 1]['text']), 'icon': f'ic86_{i // 2}.webp'} for i in range(0, len(sh), 2)]
    return {'type': 'cards', 'slide': 86, 't': title(86), 'cards': cards, 'ask': [{'q': 'Pour chaque objet, retrouve la scène où il apparaît.'}]}


def s87():
    sh = shapes(87)[1:]
    steps = [{'t': sh[i]['text'][0], 'd': ' '.join(sh[i + 1]['text'])} for i in range(0, len(sh), 2)]
    return {'type': 'steps', 'slide': 87, 't': title(87), 'steps': steps, 'arrows': True}


def s88():
    sh = shapes(88)[1:]
    items = [{'img': f'v88_{i // 2}.webp', 't': sh[i]['text'][0], 'd': sh[i + 1]['text'][0]} for i in range(0, len(sh), 2)]
    return {'type': 'gallery', 'slide': 88, 't': title(88), 'items': items, 'round': True}


def s89():
    sh = shapes(89)[1:]
    steps = [{'n': sh[i]['text'][0], 'd': ' '.join(sh[i + 1]['text'])} for i in range(0, len(sh), 2)]
    return {'type': 'steps', 'slide': 89, 't': title(89), 'steps': steps, 'list': True,
            'ask': [{'q': 'Redis ces 6 phrases avec tes propres mots, sans regarder.'}]}


def s90():
    sh = shapes(90)[1:]
    qs = [sh[i + 1]['text'][0] for i in range(0, len(sh), 2)]
    return {'type': 'discuss', 'slide': 90, 't': title(90), 'qs': qs,
            'tip': 'Prends 5 minutes pour noter ton avis, puis échange. Il n’y a pas de bonne ou de mauvaise réponse : il faut argumenter.'}


def s91():
    tx = named(91, 'Text 0')
    return {'type': 'frame', 'slide': 91, 'k': None, 't': tx[0]['text'][0], 'lines': tx[1]['text'], 'img': 'bg91.webp', 'wide': True}


def divider(n):
    tx = named(n, 'Text 0')
    return {'letter': one(n, 'Lettre grecque')[0], 'etape': one(n, 'Étiquette')[0].replace('ÉTAPE', 'Étape'), 't': tx[0]['text'][0], 'lead': tx[1]['text'][0], 'cover': f'ant/bg{n}.webp'}


plan = [x['text'] for x in shapes(53)[1:]]
temps = [{'t': plan[i * 4 + 1][0], 'sc': plan[i * 4 + 2][0], 'd': plan[i * 4 + 3][0]} for i in range(4)]

units = []
u = divider(3); u.update(n=1, short='La Grèce antique', pages=[s4(), frame(5), s6(), s7(), s8(), frame(9), s10(), frame(11), frame(12), frame(13), frame(14), s15()])
units.append(u)
u = divider(16); u.update(n=2, short='La famille d’Œdipe', pages=[s17(), frame(18), frame(19, extra={'info': 'Anouilh a écrit une autre pièce : « Œdipe ou le Roi boiteux ».'})] + [frame(n) for n in range(20, 30)] + [s30()])
units.append(u)
u = divider(32); u.update(n=3, short='Anouilh et la pièce', pages=[s33(), s34(), s35(), s36(), s37(), s38()])
units.append(u)
u = divider(39); u.update(n=4, short='Les personnages', pages=[char_page(n) for n in range(40, 50)] + [s50()])
units.append(u)
covers = ['ant/p56.webp', 'ant/p64.webp', 'ant/p67.webp', 'ant/p79.webp']
groups = [[s53()] + [frame(n) for n in range(54, 61)], [frame(n) for n in range(62, 65)], [frame(n) for n in range(65, 70)], [frame(n) for n in range(70, 82)]]
for i in range(4):
    units.append({'n': 5 + i, 'letter': 'Ε', 'etape': f'Étape 5 / 6 · Temps {i + 1}', 't': f'Temps {i + 1} · {temps[i]["t"]}', 'short': temps[i]['t'],
                  'lead': f'{temps[i]["sc"].capitalize()}. {temps[i]["d"]}', 'cover': covers[i], 'pages': groups[i]})
u = divider(83); u.update(n=9, short='Comprendre et retenir', pages=[s84(), s85(), s86(), s87(), s88(), s89(), s90(), s91()])
units.append(u)
# l’intro de l’étape 5 (texte de l’intercalaire) sur le temps 1
units[4]['intro'] = divider(52)['lead']

characters = []
for n in range(40, 50):
    p = char_page(n)
    characters.append({'id': p['char'], 'name': p['t'], 'role': p['sub'], 'facts': p['lines'], 'word': p['word'], 'img': p['img'], 'ref': [4, n - 39]})

work = {
    'id': 'antigone', 'title': 'Antigone', 'author': 'Jean Anouilh', 'year': 1944,
    'cover': 'ant/cover.webp', 'hero': 'ant/bg13.webp',
    'tagline': named(1, 'Text 0')[1]['text'][1],
    'bref': {'img': 'ant/p40.webp', 'rows': [
        ['Auteur', 'Jean Anouilh (1910-1987), auteur de théâtre français. Il a aussi écrit « L’Alouette », « Becket » ou « Médée ».'],
        ['Genre', 'Une tragédie : la fin est connue dès le début et rien ne peut la changer.'],
        ['Première', 'Le 4 février 1944, au théâtre de l’Atelier, à Paris, pendant l’Occupation. Mise en scène : André Barsacq.'],
        ['Modèle', 'La tragédie de Sophocle (vers 441 av. J.-C.), qu’Anouilh réécrit à sa façon.'],
        ['Lieu et temps', 'Thèbes, dans un décor neutre à trois portes. Une seule journée, de l’aube à cinq heures du soir.'],
        ['Héroïne', 'Antigone, fille d’Œdipe, 20 ans. Elle veut enterrer son frère Polynice malgré l’interdiction du roi Créon.'],
        ['Structure', 'Une pièce en un seul acte : 27 scènes regroupées en 4 temps.'],
    ]},
    'units': units, 'characters': characters,
}
from quizzes import QUIZZES
work['quizzes'] = QUIZZES
json.dump(work, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
print('units', len(units), 'pages', sum(len(u['pages']) for u in units))
for u in units:
    print(u['n'], u['t'], len(u['pages']))
