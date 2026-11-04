"""Quiz d'Antigone. Niveau 1 : les quiz du diaporama (réponses tirées des notes).
Les autres niveaux sont construits uniquement à partir du texte des diapositives.
ref = [étape (1 à 9), page dans l'étape]."""

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


QUIZZES = [
    {
        'n': 1, 'after': 2, 'title': 'La Grèce antique et l’histoire d’Œdipe', 'cover': 'ant/p22.webp', 'units': [1, 2],
        'sections': [
            {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? L’histoire d’Œdipe', 'items': [
                vf('Laïos apprend par un oracle que son fils le tuera.', V, [2, 2]),
                vf('Œdipe grandit à Thèbes chez ses vrais parents.', F, [2, 4], 'Il grandit à Corinthe, chez Polybe et Mérope.'),
                vf('Œdipe tue Laïos à un carrefour sans savoir qui il est.', V, [2, 6]),
                vf('Œdipe vainc le Sphinx en répondant « l’homme ».', V, [2, 7]),
                vf('Œdipe épouse Jocaste sans savoir que c’est sa mère.', V, [2, 8]),
                vf('Étéocle et Polynice règnent ensemble sans aucun problème.', F, [2, 12], 'Ils se battent et se tuent.'),
            ]},
            {'label': 'Choisis la bonne réponse', 'title': 'Choisis la bonne réponse', 'items': [
                qcm('Dans quelle cité se passe la pièce ?', ['Athènes', 'Corinthe', 'Thèbes'], 2, [1, 1]),
                qcm('À Delphes, qui répond aux questions au nom du dieu Apollon ?', ['Jocaste', 'La Pythie, une prêtresse', 'Le Sphinx'], 1, [1, 6]),
                qcm('Pour les Grecs, que devient un mort sans tombe ?', ['Son âme erre sans fin', 'Il devient un dieu', 'Il revient à la vie'], 0, [1, 9]),
                qcm('Qu’est-ce qui compte comme un enterrement ?', ['Un masque posé sur le visage', 'Une prière au Sphinx', 'Quelques poignées de terre jetées sur le corps'], 2, [1, 9]),
                qcm('Que rappelle le nom « Œdipe » ?', ['Ses pieds enflés', 'Le nom de son père', 'La ville de Corinthe'], 0, [2, 3]),
                qcm('Qui est Tirésias ?', ['Le roi de Corinthe', 'Un devin aveugle', 'Le frère de Jocaste'], 1, [2, 10]),
                qcm('Que décide Créon pour le corps de Polynice ?', ['De grandes funérailles', 'Il sera enterré à Corinthe', 'Il restera sans tombe, et qui l’enterre sera puni de mort'], 2, [2, 13]),
            ]},
            {'label': 'Classe les mots', 'title': 'Un dieu, un lieu ou la mort ?', 'type': 'sort',
             'cats': ['Un dieu', 'Un lieu', 'La mort et les morts'],
             'hint': 'Les dieux sont présentés à la page 5 de l’étape 1, les lieux sur la carte (page 1), la mort aux pages 8 et 9.',
             'items': [['Zeus', 0], ['Thèbes', 1], ['Les libations', 2], ['Apollon', 0], ['Delphes', 1], ['La sépulture', 2], ['Dionysos', 0], ['Corinthe', 1], ['Veiller le défunt', 2]],
             'ref': [1, 5]},
        ],
        'retenir': [
            {'t': 'Une cité', 'd': 'Une ville avec son territoire et ses lois. À Thèbes, il y a eu Laïos, puis Œdipe, puis Créon.'},
            {'t': 'La fatalité', 'd': 'On n’échappe pas au destin : en voulant fuir l’oracle, Laïos et Œdipe l’accomplissent.'},
            {'t': 'Un mort sans tombe', 'd': 'Il ne trouve pas le repos. Quelques poignées de terre jetées sur le corps comptent comme un enterrement.'},
            {'t': 'Le décret de Créon', 'd': 'Étéocle aura des funérailles, Polynice restera sans tombe. C’est là que commence la pièce.'},
        ],
    },
    {
        'n': 2, 'after': 4, 'title': 'Anouilh et les personnages', 'cover': 'ant/p42.webp', 'units': [3, 4],
        'sections': [
            {'label': 'Qui est-ce ?', 'title': 'QCM : qui est-ce ?', 'items': [
                qcm('Qui est le fiancé d’Antigone ?', ['Créon', 'Hémon', 'Polynice'], 1, [4, 4]),
                qcm('Qui tricote pendant presque toute la pièce ?', ['La Nourrice', 'Ismène', 'Eurydice'], 2, [4, 5]),
                qcm('Qui joue aux cartes ?', ['Les gardes', 'Le Chœur', 'Le Messager'], 0, [4, 10]),
                qcm('Qui annonce la mort d’Antigone et d’Hémon ?', ['Le Messager', 'Le Page', 'Le garde Jonas'], 0, [4, 8]),
                qcm('Comment s’appelle la chienne d’Antigone ?', ['Douce', 'Brume', 'Fidèle'], 0, [4, 6]),
                qcm('Qui explique ce qu’est une tragédie ?', ['Créon', 'Le Chœur', 'Ismène'], 1, [4, 10]),
            ]},
            {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? Anouilh et ses personnages', 'items': [
                vf('Antigone est jouée pour la première fois en 1944, à Paris.', V, [3, 1]),
                vf('La pièce d’Anouilh compte cinq actes.', F, [3, 1], 'C’est une pièce en un seul acte.'),
                vf('Chez Anouilh, le Chœur est un seul personnage qui parle au public.', V, [3, 3]),
                vf('Toute la pièce se passe en une seule journée.', V, [3, 5]),
                vf('Le décor représente un riche palais avec un temple.', F, [3, 6], 'Anouilh demande un décor neutre, avec trois portes semblables.'),
                vf('Ismène est la sœur aînée d’Antigone.', V, [4, 2]),
                vf('Créon ne veut pas sauver Antigone.', F, [4, 3], 'Il veut la sauver, mais il pense qu’un roi doit faire respecter la loi.'),
            ]},
            {'label': 'Sophocle ou Anouilh ?', 'title': 'Sophocle ou Anouilh ?', 'type': 'sort',
             'cats': ['Chez Sophocle', 'Chez Anouilh'],
             'hint': 'Revois le tableau « Sophocle et Anouilh : ce qui change » (étape 3, page 3).',
             'items': [['Vers 441 av. J.-C.', 0], ['1944', 1], ['Un théâtre en plein air, à Athènes', 0], ['Une salle de théâtre, à Paris', 1],
                       ['Des vers, un ton solennel', 0], ['Le langage de tous les jours', 1], ['Un chœur de vieillards de Thèbes', 0],
                       ['Un seul personnage qui parle au public', 1], ['Un roi sûr de lui qui finit puni', 0], ['Un roi fatigué qui ne veut pas la tuer', 1]],
             'ref': [3, 3]},
        ],
        'retenir': [
            {'t': 'Une pièce de 1944', 'd': 'Jouée pour la première fois à Paris pendant la guerre. Anouilh réécrit la tragédie de Sophocle à sa façon.'},
            {'t': 'Peu de décor', 'd': 'Un décor neutre, trois portes, une seule journée : tout repose sur le texte et sur les acteurs.'},
            {'t': 'Un mot par personnage', 'd': 'Antigone : refuser. Créon : gouverner. Ismène : craindre. Hémon : aimer. Le Garde : obéir.'},
            {'t': 'Le Chœur', 'd': 'Il présente les personnages, commente l’histoire et explique la tragédie au public.'},
        ],
    },
    {
        'n': 3, 'after': 5, 'title': 'Le petit matin (scènes 1 à 7)', 'cover': 'ant/p60.webp', 'units': [5],
        'sections': [
            {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? Le petit matin', 'items': [
                vf('Au lever du rideau, tous les personnages sont déjà sur scène.', V, [5, 2]),
                vf('Antigone dit toute la vérité à la nourrice dès son retour.', F, [5, 4], 'Elle laisse croire à un rendez-vous d’amoureux.'),
                vf('Ismène veut aider Antigone à enterrer Polynice.', F, [5, 5], 'Elle a peur et veut l’en empêcher.'),
                vf('Antigone dit à Ismène qu’elle a déjà couvert le corps de terre.', V, [5, 8], '« C’est trop tard. »'),
                vf('Antigone dit à Hémon qu’elle l’épousera bientôt.', F, [5, 7], 'Elle lui dit qu’elle ne pourra jamais l’épouser.'),
                vf('La nourrice doit promettre de ne jamais gronder la chienne Douce.', V, [5, 6]),
            ]},
            {'label': 'Choisis la bonne réponse', 'title': 'Choisis la bonne réponse', 'items': [
                qcm('Qui présente les personnages au public ?', ['Créon', 'Le Prologue', 'La nourrice'], 1, [5, 2]),
                qcm('Comment s’appellent les trois gardes ?', ['Polybe, Laïos et Créon', 'Hémon, Étéocle et Polynice', 'Jonas, Durand et Boudousse'], 2, [5, 3]),
                qcm('Comment Antigone rentre-t-elle à l’aube ?', ['Sans bruit, ses sandales à la main', 'Entourée des gardes', 'En chantant'], 0, [5, 4]),
                qcm('Pourquoi Ismène ne veut-elle pas agir ?', ['Elle n’aimait pas Polynice', 'Elle a peur : le roi les fera mourir', 'Elle doit partir à Corinthe'], 1, [5, 5]),
                qcm('Que fait jurer Antigone à Hémon ?', ['De sortir sans poser de questions', 'De parler à Créon', 'D’enterrer Polynice avec elle'], 0, [5, 7]),
            ]},
            {'label': 'Qui fait quoi ?', 'title': 'Qui dit ou fait quoi ?', 'type': 'sort',
             'cats': ['Antigone', 'Ismène', 'La nourrice', 'Hémon'],
             'hint': 'Relis les scènes 3 à 7 : chacune met Antigone face à un seul personnage.',
             'items': [['Entre sans bruit, ses sandales à la main', 0], ['Croit à un rendez-vous d’amoureux', 2], ['« Nous ne pouvons pas ! »', 1],
                       ['Demande pardon pour la dispute de la veille', 0], ['Obéit sans comprendre', 3], ['Promet de ne jamais gronder Douce', 2],
                       ['N’a pas dormi de la nuit', 1], ['« C’est trop tard. »', 0]],
             'ref': [5, 4]},
        ],
        'retenir': [
            {'t': 'Une tragédie', 'd': 'Dès le Prologue, on connaît la fin : Antigone va se dresser contre le roi et mourir.'},
            {'t': 'Les adieux', 'd': 'Antigone dit adieu à la nourrice, à Ismène et à Hémon, sans dire pourquoi.'},
            {'t': 'Prudence et action', 'd': 'Ismène choisit la prudence. Antigone ne veut pas « comprendre » : elle veut agir.'},
            {'t': 'Le premier coup de théâtre', 'd': '« C’est trop tard » : Antigone a déjà jeté de la terre sur le corps de son frère.'},
        ],
    },
    {
        'n': 4, 'after': 9, 'title': 'Toute la pièce (scènes 8 à 27)', 'cover': 'ant/bg81.webp', 'units': [6, 7, 8, 9],
        'sections': [
            {'label': 'Vrai ou faux ?', 'title': 'Vrai ou faux ? Toute la pièce', 'items': [
                vf('Créon veut d’abord sauver Antigone.', V, [7, 1]),
                vf('Antigone finit par dire oui, comme Créon.', F, [7, 3], 'Elle dit non jusqu’au bout.'),
                vf('Créon ne sait pas lequel des deux frères repose dans le tombeau de marbre.', V, [7, 4]),
                vf('Ismène meurt avec Antigone.', F, [8, 1], 'Antigone refuse de la laisser faire.'),
                vf('Le Messager annonce la mort d’Antigone et d’Hémon.', V, [8, 8]),
                vf('À la fin, Créon est entouré de sa famille.', F, [8, 10], 'Il est seul avec son page.'),
            ]},
            {'label': 'Choisis la bonne réponse', 'title': 'Choisis la bonne réponse', 'items': [
                qcm('Quelles traces trouve-t-on près du corps de Polynice ?', ['Une bague en or', 'Un pas léger et une vieille pelle d’enfant', 'Un masque de théâtre'], 1, [6, 1]),
                qcm('Pour le Chœur, pourquoi la tragédie est-elle « reposante » ?', ['Tout finit bien', 'Personne ne meurt', 'On sait qu’il n’y a plus d’espoir'], 2, [6, 2]),
                qcm('À quoi Créon compare-t-il le pays ?', ['À un bateau dans la tempête', 'À une maison en ruine', 'À un jardin endormi'], 0, [7, 3]),
                qcm('Que répond Antigone au petit bonheur que lui propose Créon ?', ['Elle accepte de se marier', 'Elle veut tout, tout de suite, ou rien', 'Elle demande à quitter Thèbes'], 1, [7, 5]),
                qcm('Que donne Antigone au garde pour qu’il écrive sa lettre ?', ['Sa chienne Douce', 'Sa petite pelle', 'Sa bague en or'], 2, [8, 6]),
                qcm('Que fait Eurydice en apprenant la mort de son fils ?', ['Elle finit son rang de tricot, puis va mourir dans sa chambre', 'Elle part au Conseil', 'Elle chasse Créon du palais'], 0, [8, 9]),
                qcm('Quelle heure sonne à la fin de la pièce ?', ['Midi', 'Cinq heures', 'Minuit'], 1, [8, 11]),
            ]},
            {'label': 'Les 5 étapes', 'title': 'Place chaque scène dans l’histoire en 5 étapes', 'type': 'sort',
             'cats': ['Début', 'Nœud', 'Crise', 'Chute', 'Fin'],
             'hint': 'Début : scène 1 · Nœud : scène 7 · Crise : scènes 10 à 15 · Chute : scènes 16 à 22 · Fin : scènes 23 à 27.',
             'items': [['Le Prologue présente les personnages', 0], ['« C’est trop tard » : l’aveu', 1], ['Antigone est arrêtée', 2], ['« Oui » ou « non » ?', 2],
                       ['Le bonheur qu’elle refuse', 2], ['« Gardes ! Emmenez-la »', 3], ['La lettre à Hémon', 3], ['Le tombeau dans la montagne', 3],
                       ['Le Messager apporte la nouvelle', 4], ['La mort d’Eurydice', 4], ['Les gardes jouent encore aux cartes', 4]],
             'ref': [9, 4]},
            {'label': 'Pour aller plus loin', 'title': 'Créon dit oui, Antigone dit non : qui pense quoi ?', 'type': 'sort',
             'cats': ['Créon', 'Antigone'],
             'hint': 'Revois la page « Deux façons de voir le monde » (étape 6, page 1).',
             'items': [['Il faut maintenir l’ordre', 0], ['Un mort doit être enterré', 1], ['Un roi doit prendre des décisions difficiles', 0],
                       ['On peut dire non à ce qu’on n’aime pas', 1], ['La vie ordinaire et le bonheur comptent', 0], ['Vouloir tout, ou rien', 1]],
             'ref': [9, 1]},
        ],
        'retenir': [
            {'t': 'Oui contre non', 'd': 'Le cœur de la pièce : Créon accepte de gouverner, Antigone refuse.'},
            {'t': 'Créon a gagné… et tout perdu', 'd': 'La loi est respectée, mais Antigone, Hémon et Eurydice sont morts. Il ne lui reste que son page.'},
            {'t': 'Les grands thèmes', 'd': 'La loi et la conscience, le pouvoir, le bonheur, la mort et le destin, la famille, grandir.'},
            {'t': 'La fin', 'd': 'La pièce finit comme elle a commencé : les gardes jouent aux cartes. Pour eux, rien n’a changé.'},
        ],
    },
]
