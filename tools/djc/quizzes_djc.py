"""Quiz du Dernier Jour d'un condamné.
Les quiz 1 à 4 du diaporama sont « sans corrigé » : les réponses ci-dessous sont établies à partir
des résumés des chapitres du diaporama (et vérifiées sur le texte de Hugo pour les deux cas douteux :
l'avocat et les travaux forcés à perpétuité, chap. II ; « la grande nouvelle de Paris », dite par l'huissier, chap. XXII).
Les autres niveaux sont construits à partir du texte des diapositives."""

V, F = True, False


def vf(q, a, ref, ex=None):
    d = {'type': 'vf', 'q': q, 'a': a, 'ref': ref}
    if ex:
        d['ex'] = ex
    return d


def qcm(q, opts, a, ref, ex=None):
    d = {'type': 'qcm', 'q': q, 'opts': opts, 'a': a, 'ref': ref}
    if ex:
        d['ex'] = ex
    return d


def cards(units, unit_n, slide):
    u = units[unit_n - 1]
    p = next(p for p in u['pages'] if p['slide'] == slide)
    return [{'t': c['t'], 'd': c['d']} for c in p['cards']]


def build_quizzes(R, units):
    who = ['Le friauche', 'L’huissier', 'L’architecte', 'Le gendarme', 'Le prêtre', 'Marie', 'Le condamné']
    synth_unit = len(units)
    these = next(p for p in units[-1]['pages'] if p['slide'] == 90)['lines']
    return [
        {
            'n': 1, 'after': 5, 'title': 'Partie I : Bicêtre', 'cover': 'djc/c28.webp', 'units': [2, 3, 4, 5],
            'sections': [
                {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? Bicêtre (chapitres 1 à 21)', 'items': [
                    vf('Le condamné est à Bicêtre depuis environ six semaines.', V, R(8)),
                    vf('Le procès a lieu un jour de pluie, en hiver.', F, R(2, 1), 'C’est un beau matin d’août : il fait très beau.'),
                    vf('L’avocat espère pour lui les travaux forcés à perpétuité.', V, R(2, 2)),
                    vf('Le condamné laisse deux fils.', F, R(9, 1), 'Il laisse trois femmes : sa vieille mère, sa femme et sa fille Marie.'),
                    vf('Sa fille Marie a trois ans.', V, R(9, 2)),
                    vf('Les forçats partent pour le bagne de Toulon.', V, R(13, 1)),
                    vf('Le directeur l’appelle « monsieur » : c’est un mauvais signe.', V, R(19)),
                    vf('Son pourvoi en cassation est accepté.', F, R(21, 2), 'Il est rejeté : l’exécution aura lieu le jour même, place de Grève.'),
                ]},
                {'label': 'QCM', 'title': 'QCM : Bicêtre', 'items': [
                    qcm('Pourquoi le condamné écrit-il son journal ?', ['Pour gagner de l’argent', 'Pour moins souffrir et faire réfléchir les juges', 'Pour préparer son évasion'], 1, R(6)),
                    qcm('Que voit-il dessiné à la craie sur le mur ?', ['Un bateau', 'L’échafaud', 'Le portrait de sa fille'], 1, R(11)),
                    qcm('Où se réveille-t-il après son évanouissement ?', ['À l’infirmerie', 'Au tribunal', 'Chez lui'], 0, R(14, 1)),
                    qcm('Quelle chanson la jeune fille chante-t-elle ?', ['Un cantique', 'Une chanson d’argot', 'Une berceuse'], 1, R(16)),
                    qcm('Quelles sont les trois étapes qui lui restent ?', ['Bicêtre, la Conciergerie, la Grève', 'Toulon, Paris, Versailles', 'Arcueil, Vincennes, Arpajon'], 0, R(15)),
                    qcm('Qui lui annonce le rejet de son pourvoi ?', ['Son avocat', 'Un huissier', 'Le roi'], 1, R(21, 2)),
                ]},
                {'label': 'Quand ?', 'title': 'Au procès, pendant les six semaines ou le dernier matin ?', 'type': 'sort',
                 'cats': ['Au procès', 'Les six semaines à Bicêtre', 'Le dernier matin'],
                 'hint': 'Le procès : chapitre 2. Les six semaines : chapitres 3 à 17. Le dernier jour commence au chapitre 18, à six heures du matin.',
                 'items': [['Une petite fleur jaune au soleil', 0], ['On lui met la camisole de force', 1], ['Le guichetier lui demande ce qu’il veut pour déjeuner', 2],
                           ['Une jeune fille bat des mains', 0], ['Le dessin de l’échafaud sur le mur', 1], ['Le directeur l’appelle « monsieur »', 2],
                           ['Le ferrement des forçats', 1], ['L’huissier lit le rejet du pourvoi', 2]],
                 'ref': R(18)},
            ],
            'retenir': cards(units, 5, 43),
        },
        {
            'n': 2, 'after': 9, 'title': 'Partie II : la Conciergerie', 'cover': 'djc/c73.webp', 'units': [6, 7, 8, 9],
            'sections': [
                {'label': 'Qui a dit… ?', 'title': 'Qui a dit… ?', 'items': [
                    qcm('« Ah ! savez-vous la grande nouvelle de Paris, aujourd’hui ? »', who, 1, R(22, 2)),
                    qcm('« Donnez-la-moi, je la vendrai pour avoir du tabac. »', who, 0, R(23, 3)),
                    qcm('« Mon bon ami, dans six mois cette prison sera beaucoup mieux. »', who, 2, R(31)),
                    qcm('« Pour qu’ils soient bons, il faut que vous soyez mort. »', who, 3, R(32, 2)),
                    qcm('« Mon fils, croyez-vous en Dieu ? »', who, 4, R(30, 1)),
                    qcm('« Non, mon papa était bien plus beau. »', who, 5, R(43, 1)),
                    qcm('« Eux les chapeaux, moi la tête. »', who, 6, R(48, 2)),
                ]},
                {'label': 'Choisis la bonne réponse', 'title': 'Choisis la bonne réponse', 'items': [
                    qcm('Combien d’hommes accompagnent le condamné dans la voiture ?', ['Deux', 'Huit', 'Vingt'], 1, R(22, 1)),
                    qcm('Pourquoi le friauche a-t-il été envoyé aux galères à vie ?', ['Il avait faim et il a volé un pain', 'Il a tué un gendarme', 'Il s’est évadé de Bicêtre'], 0, R(23, 2)),
                    qcm('Que propose le condamné au gendarme de la loterie ?', ['De lui donner sa redingote', 'De changer d’habits avec lui', 'D’écrire au roi'], 1, R(32, 2)),
                    qcm('Avec qui se promène-t-il dans ses souvenirs de jeunesse ?', ['Marie', 'Sa mère', 'Pepa, une jeune Espagnole'], 2, R(33)),
                    qcm('Que lit Marie sur le papier qu’elle tient ?', ['Une lettre de sa mère', '« ARRÊT » : l’arrêt de mort de son père', 'Un conte pour enfants'], 1, R(43, 2)),
                    qcm('Que contient le chapitre « Mon histoire » ?', ['Rien : une note dit que les pages n’ont pas été retrouvées', 'Le récit de son crime', 'Une lettre au roi'], 0, R(47)),
                ]},
                {'label': 'Quelle heure ?', 'title': 'Quelle heure est-il ?', 'type': 'sort',
                 'cats': ['10 h', '11 h', '13 h', '13 h 15'],
                 'hint': 'L’heure est écrite en haut de chaque chapitre : 10 h (chapitre 26), 11 h (chapitre 28), 13 h (chapitres 34 et 35), 13 h 15 (chapitre 38).',
                 'items': [['Il pense à Marie : plus que six heures à vivre', 0], ['On graisse sans doute la rainure du couteau', 1], ['Une heure sonne : il retrouve son crime avec horreur', 2],
                           ['Tout Paris vit normalement', 2], ['Il a froid et chaud, la plume lui tombe des mains', 3]],
                 'ref': R(26)},
            ],
            'retenir': cards(units, 9, 80),
        },
        {
            'n': 3, 'after': synth_unit, 'title': 'Toute l’œuvre', 'cover': 'djc/c83.webp', 'units': [10, synth_unit],
            'sections': [
                {'label': 'Remets dans l’ordre', 'title': 'Remets les événements dans l’ordre', 'type': 'order',
                 'hint': 'Suis le trajet du condamné : Bicêtre (chapitres 1 à 21), puis la Conciergerie (22 à 47), puis la place de Grève (48 et 49).',
                 'items': [
                     {'t': 'Le friauche prend la redingote du condamné.', 'img': 'djc/o0.webp', 'ch': 23},
                     {'t': 'La toilette du condamné : on lui coupe les cheveux.', 'img': 'djc/o1.webp', 'ch': 48},
                     {'t': 'L’huissier lit le rejet du pourvoi.', 'img': 'djc/o2.webp', 'ch': 21},
                     {'t': 'Marie ne reconnaît pas son père.', 'img': 'djc/o3.webp', 'ch': 43},
                     {'t': 'Le gendarme demande trois numéros de loterie.', 'img': 'djc/o4.webp', 'ch': 32},
                     {'t': 'Le départ en voiture pour la Conciergerie.', 'img': 'djc/o5.webp', 'ch': 22},
                     {'t': 'Le condamné supplie un juge à l’Hôtel de Ville.', 'img': 'djc/o6.webp', 'ch': 49},
                     {'t': 'Le ferrement des forçats dans la cour de Bicêtre.', 'img': 'djc/o7.webp', 'ch': 13},
                 ],
                 'answer': [7, 2, 5, 0, 4, 3, 1, 6], 'ref': [1, 8]},
                {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? La place de Grève', 'items': [
                    vf('On coupe les cheveux du condamné : c’est « la toilette du condamné ».', V, R(48, 1)),
                    vf('Dans la charrette, le condamné est assis face au cheval.', F, R(48, 2), 'Il est assis dos au cheval, avec le prêtre.'),
                    vf('La foule crie « Chapeaux bas ! », comme pour le roi.', V, R(48, 2)),
                    vf('À l’Hôtel de Ville, le juge lui accorde sa grâce.', F, R(49, 1), 'Le juge sourit : il n’y a pas de grâce.'),
                    vf('Le roman décrit l’exécution en détail.', F, R(49, 2), 'Le journal s’arrête sur deux mots : « QUATRE HEURES ».'),
                    vf('Le livre paraît d’abord sans nom d’auteur.', V, [1, 2]),
                ]},
                {'label': 'Les registres', 'title': 'Pathétique, tragique, ironique ou fantastique ?', 'type': 'sort',
                 'cats': ['Pathétique', 'Tragique', 'Ironique', 'Fantastique'],
                 'hint': 'Revois la page « Thèmes et registres » de la synthèse : chaque registre y a un exemple.',
                 'items': [['Marie ne reconnaît pas son père', 0], ['La mort est certaine dès la première page', 1], ['« Encore deux heures… et je serai guéri. »', 2],
                           ['Les spectres du cachot', 3], ['Marie épelle « ARRÊT »', 0], ['« Je perds plus que vous », dit-il à l’huissier', 2], ['Le cauchemar de la petite vieille', 3]],
                 'ref': [synth_unit, 1]},
            ],
            'retenir': [{'t': f'Argument {i + 1}', 'd': t} for i, t in enumerate(these)],
        },
    ]
