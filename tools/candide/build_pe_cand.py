"""Construit src/content/pe_candide.json à partir de pe_cand_raw.json (texte du kit) et des corrigés ci-dessous.
Le kit ne contient pas de corrigé : les réponses sont établies d'après le texte des activités et le roman."""
import json
import re
import sys

R = json.load(open('pe_cand_raw.json'))

TITLES = ['La liberté des jeunes face aux parents', 'Les réseaux sociaux : vie réelle ou vie parfaite ?', 'L’émigration : rêve ou illusion ?',
          'Parler de ses malheurs : faiblesse ou force ?', 'L’argent fait-il le bonheur ?', 'Devons-nous raconter nos secrets à nos amis ?', 'Le travail des femmes']
EPISODES = ['Candide chassé du château', 'Pangloss et son optimisme', 'Le départ pour l’Amérique', 'L’histoire de la vieille',
            'L’Eldorado, pays de l’or', 'Cacambo et l’abbé de Paris', 'Les femmes et le jardin']
OBJ = [
    ('Donner mon avis', ['Donner mon avis'], ['À mon avis,', 'Je pense que', 'Selon moi,', 'Je suis convaincu(e) que'],
     ['À mon avis, les jeunes doivent choisir leurs études.', 'Je pense que les parents donnent souvent de bons conseils.']),
    ('Présenter et ajouter des arguments', ['Présenter et ajouter un argument'], ['D’abord,', 'Ensuite,', 'De plus,', 'Enfin,'],
     ['D’abord, les réseaux sociaux nous permettent de parler avec nos amis.', 'De plus, ils montrent souvent une vie trop parfaite.']),
    ('Donner un exemple', ['Donner un exemple'], ['Par exemple,', 'Prenons l’exemple de', 'Comme', 'Ainsi,'],
     ['Par exemple, Candide part en Amérique pour trouver un monde meilleur.', 'Prenons l’exemple de mon cousin : il travaille en Espagne et aide sa famille.']),
    ('Expliquer', ['Expliquer'], ['car', 'parce que', 'en effet,', 'puisque'],
     ['Il faut parler de ses problèmes, car on se sent mieux après.', 'En effet, une personne qui nous écoute peut nous aider.']),
    ('Opposer deux idées', ['Opposer'], ['mais', 'cependant,', 'pourtant,', 'toutefois,'],
     ['L’argent est utile, mais il ne suffit pas pour être heureux.', 'Candide est très riche. Pourtant, il n’est pas heureux.']),
    ('Exprimer une conséquence', ['Exprimer une conséquence'], ['donc', 'c’est pourquoi', 'alors', 'par conséquent,'],
     ['Mon ami est fidèle, donc je lui confie mes secrets.', 'Certains amis parlent trop. C’est pourquoi il faut être prudent.']),
    ('Nuancer et conclure', ['Nuancer', 'Conclure'], ['Il est vrai que…, mais…', 'Certes…, mais…', 'En conclusion,', 'En définitive,'],
     ['Il est vrai que le travail est fatigant, mais il rend la femme indépendante.', 'En définitive, chaque femme doit pouvoir choisir sa vie.']),
]
AIDE = ['forte', 'forte', 'forte', 'moyenne', 'moyenne', 'légère', 'légère']

# Corrigés : vocab = indice de la définition (a=0…d=3) pour chaque mot ; order = indices des paragraphes dans le bon ordre ;
# holes = indice du bon connecteur ; args = colonne (0, 1) ou -1 pour l'intrus ; good et n3 = indice de la bonne phrase.
KEY = {
    1: dict(vocab=[2, 0, 3, 1], vf=[1, 0, 1], conno=[['choix', 'droit', 'indépendance', 'décider', 'autonomie'], ['protection', 'conseil', 'amour', 'éducation', 'autorité']],
            order=[1, 3, 0, 2], holes=[1, 0, 2, 1],
            hints=['Ce trou introduit ton avis.', 'La phrase qui suit donne un exemple tiré de Candide.', 'La phrase qui suit apporte une idée opposée.', 'Ce trou annonce la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': 1, 'e': -1, 'f': 1, 'g': 0}, why='Elle parle de football, pas de la liberté des jeunes face aux parents.', good=1, n3=[0, 2, 1]),
    2: dict(vocab=[3, 0, 1, 2], vf=[0, 1, 1], conno=[['like', 'abonné', 'partage', 'photo', 'vidéo'], ['travail', 'famille', 'problèmes', 'efforts', 'quotidien']],
            order=[2, 1, 3, 0], holes=[1, 0, 2, 2],
            hints=['Ce trou annonce le premier argument.', 'Ce trou ajoute un deuxième argument.', 'La phrase qui suit apporte une idée opposée.', 'Ce trou annonce la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': 1, 'e': -1, 'f': 0, 'g': 1}, why='Elle parle du couscous, pas des réseaux sociaux.', good=3, n3=[1, 0, 2]),
    3: dict(vocab=[1, 3, 0, 2], vf=[1, 1, 0], conno=[['voyage', 'frontière', 'valise', 'départ', 'étranger'], ['espoir', 'avenir', 'réussite', 'ambition', 'désir']],
            order=[3, 0, 2, 1], holes=[1, 0, 2, 1],
            hints=['La phrase qui suit donne un exemple tiré de Candide.', 'La phrase qui suit montre le contraire de ce que Candide croyait.', 'Ce trou ajoute une autre difficulté.', 'Ce trou annonce la conséquence : la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': -1, 'e': 1, 'f': 0, 'g': 1}, why='Elle parle des dromadaires, pas de l’émigration.', good=0, n3=[1, 2, 0]),
    4: dict(vocab=[2, 0, 3, 1], vf=[0, 1, 1], conno=[['attention', 'silence', 'conseil', 'oreille', 'patience'], ['douleur', 'tristesse', 'larmes', 'blessure', 'peine']],
            order=[2, 3, 0, 1], holes=[1, 0, 2, 1],
            hints=['La suite explique pourquoi il est important d’en parler.', 'La phrase qui suit explique et précise l’idée précédente.', 'La suite donne la raison (la cause) du récit de la vieille.', 'Ce trou annonce la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': 1, 'e': -1, 'f': 0, 'g': 1}, why='Elle parle du printemps, pas de nos malheurs.', good=2, n3=[0, 2, 1]),
    5: dict(vocab=[1, 3, 0, 2], vf=[1, 0, 1], conno=[['salaire', 'richesse', 'banque', 'dépenser', 'économies'], ['joie', 'sourire', 'paix', 'amour', 'satisfaction']],
            order=[1, 3, 2, 0], holes=[1, 2, 0, 1],
            hints=['Ce trou annonce le premier argument.', 'La phrase qui suit dit le contraire : l’argent ne peut pas tout acheter.', 'Candide est riche… mais il n’est pas heureux : c’est une opposition.', 'Ce trou annonce la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': -1, 'e': 1, 'f': 0, 'g': 1}, why='Elle parle des girafes, pas de l’argent ni du bonheur.', good=1, n3=[1, 2, 0]),
    6: dict(vocab=[3, 1, 0, 2], vf=[1, 1, 0], conno=[['confiance', 'fidélité', 'aide', 'partage', 'écoute'], ['cacher', 'confier', 'silence', 'intime', 'mystère']],
            order=[3, 0, 1, 2], holes=[1, 2, 0, 2],
            hints=['La suite est une conséquence : il écoute, alors on a confiance.', 'Cacambo est fidèle : la suite en est la conséquence.', 'La phrase qui suit apporte une idée opposée.', 'Ce trou annonce la conséquence finale : la conclusion.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': -1, 'e': 1, 'f': 0, 'g': 1}, why='Elle parle des pommes de terre, pas des secrets entre amis.', good=0, n3=[1, 0, 2]),
    7: dict(vocab=[2, 0, 3, 1], vf=[0, 1, 1], conno=[['métier', 'salaire', 'effort', 'bureau', 'compétence'], ['mère', 'courage', 'dignité', 'intelligence', 'force']],
            order=[2, 3, 1, 0], holes=[1, 1, 2, 2],
            hints=['Ce trou annonce le premier argument.', 'La phrase qui suit donne un exemple tiré de Candide.', 'Certes… mais… : on reconnaît une difficulté avant de la discuter.', 'Ce trou annonce la conclusion du texte.'],
            args={'a': 0, 'b': 1, 'c': 0, 'd': 1, 'e': -1, 'f': 0, 'g': 1}, why='Elle parle des dauphins, pas du travail des femmes.', good=3, n3=[2, 0, 1]),
}
IDEAS2 = ['les photos avec filtres', 'se comparer aux autres', 'Pangloss dit que tout va bien', 'garder le contact avec la famille']
IMG = ['cand/ch01_i4.webp', 'cand/ch01_i2.webp', 'cand/ch10_i3.webp', 'cand/ch10_i4.webp', 'cand/ch17_i2.webp', 'cand/ch19_i4.webp', 'cand/ch30_i5.webp']

themes = []
for r in R:
    n = r['n']
    k = KEY[n]
    assert len(k['vocab']) == len(r['vocab']['words']) and len(k['vf']) == len(r['vf'])
    for c, ans in zip(r['conno'], k['conno']):
        assert all(a in c['options'] for a in ans) and len(ans) == 5, (n, c, ans)
    assert sorted(k['order']) == [0, 1, 2, 3]
    aide_lines = r['n4']['aide_raw'].split('\n')
    starters = [l.strip() for l in aide_lines if re.fullmatch(r'[A-ZÀ-Ü][^,.!:]{0,20},', l.strip())]
    desc = clean = re.sub(r'\s+', ' ', ' '.join(l for l in aide_lines if l.strip() not in starters)).strip()
    desc = re.sub(r'\s*Idées possibles :.*$', '', desc)
    ideas = r['n4']['ideas'] or (IDEAS2 if n == 2 else [])
    name, rows, exprs, examples = OBJ[n - 1]
    themes.append({
        'n': n, 'title': TITLES[n - 1], 'img': IMG[n - 1], 'episode': EPISODES[n - 1],
        'oeuvre': {'chapitres': r['oeuvre']['chapitres'], 'texte': r['oeuvre']['texte']},
        'objectif': {'name': name, 'rows': rows, 'expressions': exprs, 'examples': examples},
        'n0': {
            'vocab': {'words': r['vocab']['words'], 'defs': r['vocab']['defs'], 'answer': k['vocab']},
            'vf': [{'q': q, 'a': bool(a)} for q, a in zip(r['vf'], k['vf'])],
            'conno': [{'mot': c['mot'], 'options': c['options'], 'answer': ans} for c, ans in zip(r['conno'], k['conno'])],
        },
        'n1': {'paras': r['paras'], 'answer': k['order'], 'help': r['order_help']},
        'n2': {
            'text': r['conn_text'],
            'holes': [{'opts': o, 'a': a, 'hint': h} for o, a, h in zip(r['holes'], k['holes'], k['hints'])],
            'b': {'title': r['b_title'], 'consigne': r['b_consigne'], 'cats': [c.capitalize() if c.isupper() else c for c in r['cats']],
                  'args': [{'l': l, 't': t, 'cat': k['args'][l]} for l, t in r['args']], 'intrus_why': k['why']},
            'good': {'opts': r['good'], 'a': k['good']},
        },
        'n3': [dict(p, a=a) for p, a in zip(r['n3'], k['n3'])],
        'n4': {'consigne': r['n4']['consigne'], 'aide': {'level': AIDE[n - 1], 'desc': desc, 'ideas': ideas, 'starters': starters}},
        'n5': {'sujet': r['sujet'], 'grille': r['grille']},
    })

kit = {
    'id': 'candide', 'title': 'Production écrite argumentative — Candide', 'level': '2e année du baccalauréat',
    'hero': 'cand/ch30_i3.webp',
    'examIntro': 'À l’examen national, on te demande de donner ton avis sur une question liée à l’œuvre, avec des arguments et des exemples. Voici comment construire ton texte.',
    'vfHint': 'Pense à ce que tu sais du roman : les personnages, les lieux et les aventures de Candide.',
    'semestre': 'Les sept thèmes du premier semestre',
    'themes': themes,
    'expressions': [
        ['Donner mon avis', 'À mon avis… / Je pense que… / Je suis convaincu(e) que…'],
        ['Présenter et ajouter un argument', 'D’abord… / Ensuite… / De plus… / Enfin…'],
        ['Donner un exemple', 'Par exemple… / Prenons l’exemple de… / Comme dans…'],
        ['Expliquer', 'car… / parce que… / en effet…'],
        ['Opposer', 'mais… / cependant… / pourtant… / toutefois…'],
        ['Exprimer une conséquence', 'donc… / c’est pourquoi… / par conséquent…'],
        ['Nuancer', 'Il est vrai que…, mais… / Certes…, mais…'],
        ['Conclure', 'En conclusion… / En définitive… / Pour conclure…'],
    ],
    'connecteurs': [
        ['Introduire', 'D’abord, Premièrement, Tout d’abord'], ['Ajouter', 'De plus, Ensuite, En outre, Par ailleurs, Enfin'],
        ['Illustrer', 'Par exemple, Ainsi, Notamment, Comme'], ['Expliquer', 'En effet, Car, Parce que, Puisque'],
        ['Opposer', 'Mais, Cependant, Pourtant, Néanmoins, Toutefois'], ['Nuancer', 'Il est vrai que…, mais… / Certes…, mais…'],
        ['Conséquence', 'Donc, C’est pourquoi, Par conséquent, Alors'], ['Conclure', 'En conclusion, En somme, En définitive, Pour conclure'],
    ],
    'structure': [
        ['Introduction', 'Je présente le sujet et je pose la question du débat.'], ['Thèse', 'Je donne clairement mon opinion : « À mon avis… ».'],
        ['Argument 1 + exemple', 'D’abord… + un exemple précis (tiré de Candide ou de la vie).'], ['Argument 2 + exemple', 'Ensuite… / De plus… + un exemple.'],
        ['Avis opposé (facultatif)', 'Il est vrai que… / Certains pensent que… Cependant…'], ['Conclusion', 'En conclusion… : je résume mon avis et j’élargis la réflexion.'],
    ],
    'candideExamples': ['Dans Candide, Voltaire montre que…', 'Prenons l’exemple de Candide, qui…', 'Comme Candide quand il quitte l’Eldorado, …',
                        'Le personnage de Cacambo (de la vieille, de Pangloss…) montre que…'],
    # Texte modèle de la page « Structure » : composé à partir des phrases du thème 1 du kit
    'model': {
        'sujet': 'Les parents doivent-ils décider à la place de leurs enfants ?',
        'parts': [
            {'part': 'Introduction', 'segs': [['intro', 'Aujourd’hui, beaucoup de jeunes veulent choisir seuls leurs études, leurs amis et leur avenir. '], ['intro', 'Les parents doivent-ils décider à la place de leurs enfants ? '], ['these', 'À mon avis, les parents doivent conseiller leurs enfants, mais ce sont les jeunes qui doivent choisir leur vie.']]},
            {'part': 'Argument 1', 'segs': [['conn', 'D’abord'], ['arg', ', les jeunes connaissent mieux que personne leurs goûts et leurs rêves : choisir ses études, c’est choisir sa vie. '], ['conn', 'Par exemple'], ['ex', ', dans Candide, le baron chasse Candide du château parce qu’il a embrassé Cunégonde : les jeunes amoureux ne sont pas libres.']]},
            {'part': 'Argument 2', 'segs': [['conn', 'De plus'], ['arg', ', un jeune qui choisit seul devient plus responsable. '], ['ex', 'Un élève qui a choisi sa filière travaille avec plaisir et motivation.']]},
            {'part': 'Nuance', 'segs': [['conn', 'Cependant'], ['arg', ', les parents ont de l’expérience et ils veulent protéger leurs enfants des dangers. '], ['ex', 'À 17 ans, on peut faire des erreurs graves.']]},
            {'part': 'Conclusion', 'segs': [['conn', 'En conclusion'], ['concl', ', les parents doivent conseiller leurs enfants, mais ils doivent aussi respecter leurs choix.']]},
        ],
    },
}
json.dump(kit, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1)
for t in themes:
    print(t['n'], t['title'], '| aide', t['n4']['aide']['level'], t['n4']['aide']['starters'], t['n4']['aide']['ideas'], '|', t['n4']['aide']['desc'][:90])
