"""Lit le kit « Production écrite argumentative — Candide » (pe.pdf) et produit pe_cand_raw.json.
Les réponses ne figurent pas dans le kit : elles sont ajoutées par build_pe_cand.py."""
import json
import re

import pdfplumber

pdf = pdfplumber.open('pe.pdf')
STARTS = [4, 10, 17, 24, 30, 36, 43, 49]  # pages (1-based) de début des thèmes, puis aide-mémoire


def clean(s):
    return re.sub(r'\s+', ' ', (s or '').replace('\n', ' ')).strip()


def strip_page(t):
    lines = [l for l in t.split('\n') if not l.startswith('Production écrite argumentative ·') and not re.fullmatch(r'\d+', l.strip())]
    return '\n'.join(lines)


themes = []
for ti in range(7):
    pages = list(range(STARTS[ti] - 1, STARTS[ti + 1] - 1))
    text = '\n'.join(strip_page(pdf.pages[p].extract_text()) for p in pages)
    tables = [t for p in pages for t in pdf.pages[p].extract_tables()]
    L = text.split('\n')
    th = {'n': ti + 1}
    i = next(k for k, l in enumerate(L) if l.replace(' ', '') == f'THÈME{ti + 1}')
    j = next(k for k in range(i + 1, len(L)) if L[k].startswith('Œuvre :'))
    th['title'] = clean(' '.join(L[i + 1:j]))
    # Le thème dans l'œuvre
    m = re.search(r'LE THÈME DANS L’ŒUVRE\s*(Chapitres? [^\n]+)\n(.+?)\nOBJECTIF DE LANGUE', text, re.S)
    th['oeuvre'] = {'chapitres': clean(m.group(1)), 'texte': clean(m.group(2))}
    # Objectif de langue
    m = re.search(r'OBJECTIF DE LANGUE Exemples\n(.+?)\n0 NIVEAU 0', text, re.S)
    block = m.group(1)
    ex = re.findall(r'•\s*([^•]+)', block)
    th['objectif_examples_raw'] = block
    # Niveau 0
    voc = next(t for t in tables if t and t[0][:1] == ['Mot'])
    th['vocab'] = {'words': [clean(r[0]) for r in voc[1:]], 'letters': [clean(r[2]) for r in voc[1:]], 'defs': [clean(r[3]) for r in voc[1:]]}
    vf = next(t for t in tables if t and t[0][:1] == ['Phrase'])
    th['vf'] = [clean(r[0]) for r in vf[1:]]
    m = re.search(r'Attention : 3 mots sont des intrus !\n(.+?)\nJe réutilise', text, re.S)
    cl = m.group(1).split('\n')
    conno = []
    for k in range(0, len(cl), 3):
        opts = ' '.join([cl[k + 1], cl[k + 2]])
        for mw in ('baguette magique', 'flamant rose'):
            opts = opts.replace(mw, mw.replace(' ', '_'))
        conno.append({'mot': clean(cl[k]), 'options': [o.replace('_', ' ') for o in opts.split()]})
    th['conno'] = conno
    th['conno_lines'] = cl
    # Niveau 1
    order = next(t for t in tables if t and t[0] and (t[0][0] or '').startswith('N°'))
    th['paras'] = [clean(r[1]) for r in order]
    m = re.search(r'Aide-toi des mots en gras : (.+?)\.\n', text)
    th['order_help'] = clean(m.group(1)) if m else None
    # Niveau 2
    m = re.search(r'juste avant le numéro\.\n(.+?)\nTrou \(1\)', text, re.S)
    th['conn_text'] = re.sub(r'\((\d)\)', r'[[\1]]', clean(m.group(1)))
    holes = [t for t in tables if t and t[0] and (t[0][0] or '').startswith('Trou')][0]
    th['holes'] = [[clean(x) for x in r[1:]] for r in holes]
    m = re.search(r'Activité B — (Classer.+?)\nConsigne : (.+?)\na\)', text, re.S)
    th['b_title'], th['b_consigne'] = clean(m.group(1)), clean(m.group(2))
    th['args'] = [[a, clean(b)] for a, b in re.findall(r'^([a-g])\) (.+)$', text.split('Activité B — Classer')[1].split('Activité C — Repérer')[0], re.M)]
    cats = next(t for t in tables if t and len(t) == 2 and len(t[1]) == 6 and all((c or '……').startswith('……') for c in t[1]))
    th['cats'] = [clean(c) for c in cats[0] if c]
    m = re.search(r'Activité C — Repérer le bon argument\n.+?\n(1\. .+?)\nLa bonne phrase', text, re.S)
    th['good'] = [clean(x) for x in re.findall(r'^\d\. (.+)$', m.group(1), re.M)]
    # Niveau 3
    n3 = []
    for k in (1, 2, 3):
        m = re.search(rf'Paragraphe {k}\n(.+?)\n(.+?)\na\) (.+?)\nb\) (.+?)\nc\) (.+?)\n', text + '\n', re.S)
        n3.append({'s1': clean(m.group(1)), 's3': clean(m.group(2)), 'opts': [clean(m.group(3)), clean(m.group(4)), clean(m.group(5))]})
    th['n3'] = n3
    # Niveau 4
    m = re.search(r'Consigne : (Rédige un paragraphe.+?)\n(Aide (?:forte|moyenne|légère)) (.+?)\nDéfi binôme', text, re.S)
    th['n4'] = {'consigne': clean(m.group(1)), 'aide': m.group(2), 'aide_raw': m.group(3)}
    ideas = [t for t in tables if t and t[0] and clean(t[0][0]) == th['n4']['aide'] and len(t) == 2]
    th['n4']['ideas'] = [clean(c) for c in ideas[0][1] if c] if ideas else []
    # Niveau 5
    m = re.search(r'SUJET TYPE EXAMEN\n(.+?)\nÉtape 1', text, re.S)
    th['sujet'] = clean(m.group(1))
    m = re.search(r'Oui Non Oui Non\n(.+?)\nLe conseil de mon binôme', text, re.S)
    th['grille'] = [clean(x) for x in m.group(1).split('\n') if clean(x)]
    themes.append(th)

json.dump(themes, open('pe_cand_raw.json', 'w'), ensure_ascii=False, indent=1)
for t in themes:
    print(t['n'], t['title'], '| vocab', len(t['vocab']['words']), '| vf', len(t['vf']), '| conno', [len(c['options']) for c in t['conno']], '| paras', len(t['paras']),
          '| holes', len(t['holes']), '| args', len(t['args']), '| cats', t['cats'], '| good', len(t['good']), '| grille', len(t['grille']), '|', t['n4']['aide'], len(t['n4']['ideas']))
