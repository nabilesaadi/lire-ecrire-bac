"""Quiz de Candide : questions du diaporama (4 niveaux par quiz).
Le diaporama ne donne pas les corrigés : les réponses sont établies à partir des idées des chapitres.
ref = [chapitre, idée]. Les tableaux ont 4 mots par colonne, comme dans le diaporama."""


def vf(q, a, ref):
    return {'type': 'vf', 'q': q, 'a': a, 'ref': ref}


def qcm(q, opts, a, ref):
    return {'type': 'qcm', 'q': q, 'opts': opts, 'a': a, 'ref': ref}


L = ['Vrai ou faux ?', 'QCM : je retrouve', 'Tableau : je classe', 'QCM : je comprends']

QUIZZES = [
    {'n': 1, 'chapters': [1, 2, 3, 4, 5, 6], 'sections': [
        {'label': L[0], 'title': 'Vrai ou faux ?', 'items': [
            vf('Candide habite dans un château.', True, [1, 1]),
            vf('Pangloss dit : « Tout va mal. »', False, [1, 2]),
            vf('Le baron chasse Candide du château.', True, [1, 4]),
            vf('Candide devient soldat bulgare.', True, [2, 2]),
            vf('Jacques est un homme méchant.', False, [3, 4]),
            vf('Il y a un tremblement de terre à Lisbonne.', True, [5, 4])]},
        {'label': L[1], 'title': 'QCM : je retrouve', 'items': [
            qcm('Qui aime Candide ?', ['Paquette', 'Cunégonde', 'la baronne'], 1, [1, 3]),
            qcm('Pourquoi le baron chasse-t-il Candide ?', ['Il a volé.', 'Il a embrassé Cunégonde.', 'Il est malade.'], 1, [1, 4]),
            qcm('Qui est le pauvre malade ?', ['Jacques', 'le baron', 'Pangloss'], 2, [4, 1])]},
        {'label': L[2], 'title': 'Tableau : je classe', 'type': 'sort', 'cats': ['Personnages', 'Lieux', 'Malheurs'],
         'items': [['la Hollande', 1], ['Cunégonde', 0], ['le baron', 0], ['la tempête', 2], ['la guerre', 2], ['Lisbonne', 1],
                   ['Jacques', 0], ['la Westphalie', 1], ['l’autodafé', 2], ['le tremblement de terre', 2], ['le château', 1], ['Pangloss', 0]]},
        {'label': L[3], 'title': 'QCM : je comprends', 'items': [
            qcm('Pourquoi Jacques meurt-il ?', ['Le marin ne l’aide pas.', 'Il est malade.', 'Il meurt à la guerre.'], 0, [5, 2]),
            qcm('Pourquoi les chefs de Lisbonne font-ils un autodafé ?', ['Pour fêter la fin de la tempête', 'Pour arrêter les tremblements de terre', 'Pour accueillir le roi'], 1, [6, 1]),
            qcm('Quel est le bon ordre ? ① la guerre ② le château ③ Lisbonne', ['② ① ③', '① ② ③', '③ ② ①'], 0, [3, 1])]},
    ]},
    {'n': 2, 'chapters': [7, 8, 9, 10, 11, 12], 'sections': [
        {'label': L[0], 'title': 'Vrai ou faux ?', 'items': [
            vf('La vieille aide Candide.', True, [7, 1]),
            vf('Cunégonde est morte.', False, [7, 4]),
            vf('Candide tue don Issachar.', True, [9, 2]),
            vf('Un moine vole l’argent de Cunégonde.', True, [10, 1]),
            vf('La vieille est la fille d’un roi.', False, [11, 1]),
            vf('La vieille a perdu une fesse.', True, [12, 2])]},
        {'label': L[1], 'title': 'QCM : je retrouve', 'items': [
            qcm('Qui envoie la vieille aider Candide ?', ['Pangloss', 'Cunégonde', 'le roi'], 1, [8, 4]),
            qcm('Avec quoi Candide tue-t-il don Issachar ?', ['une épée', 'un bâton', 'un fusil'], 0, [9, 2]),
            qcm('Où vont-ils en bateau ?', ['en Afrique', 'en Amérique', 'en Asie'], 1, [10, 2])]},
        {'label': L[2], 'title': 'Tableau : je classe', 'type': 'sort', 'cats': ['Personnages', 'Lieux', 'Malheurs de la vieille'],
         'items': [['la peste', 2], ['les pirates', 2], ['le Grand Inquisiteur', 0], ['Lisbonne', 1], ['la faim', 2], ['Cadix', 1],
                   ['don Issachar', 0], ['la vieille', 0], ['l’esclavage', 2], ['Azof', 1], ['le moine voleur', 0], ['le Maroc', 1]]},
        {'label': L[3], 'title': 'QCM : je comprends', 'items': [
            qcm('Pourquoi Candide tue-t-il le Grand Inquisiteur ?', ['Il veut son argent.', 'Il a peur d’être brûlé.', 'L’Inquisiteur insulte Pangloss.'], 1, [9, 3]),
            qcm('Pourquoi la vieille raconte-t-elle son histoire ?', ['Pour montrer qu’elle a eu plus de malheurs', 'Pour faire rire les passagers', 'Pour devenir capitaine'], 0, [10, 4]),
            qcm('Que pense la vieille de la vie ?', ['Elle déteste la vie.', 'Elle aime encore la vie.', 'La vie est facile.'], 1, [12, 3])]},
    ]},
    {'n': 3, 'chapters': [13, 14, 15, 16, 17, 18], 'sections': [
        {'label': L[0], 'title': 'Vrai ou faux ?', 'items': [
            vf('Le gouverneur veut épouser Cunégonde.', True, [13, 2]),
            vf('Cacambo est le valet de Candide.', True, [14, 1]),
            vf('Le commandant des jésuites est le père de Cunégonde.', False, [14, 4]),
            vf('Les Oreillons mangent Candide.', False, [16, 4]),
            vf('En Eldorado, les enfants jouent avec de l’or.', True, [17, 2]),
            vf('En Eldorado, il y a beaucoup de prisons.', False, [18, 1])]},
        {'label': L[1], 'title': 'QCM : je retrouve', 'items': [
            qcm('Pourquoi Candide fuit-il Buenos Aires ?', ['La police le cherche.', 'Il n’aime plus Cunégonde.', 'Il veut voir l’Eldorado.'], 0, [13, 3]),
            qcm('Qu’est-ce que Candide tue dans la forêt ?', ['deux lions', 'deux singes', 'deux serpents'], 1, [16, 1]),
            qcm('De quelle couleur sont les moutons d’Eldorado ?', ['blancs', 'noirs', 'rouges'], 2, [18, 4])]},
        {'label': L[2], 'title': 'Tableau : je classe', 'type': 'sort', 'cats': ['Au Paraguay', 'Chez les Oreillons', 'En Eldorado'],
         'items': [['les moutons rouges', 2], ['la machine', 2], ['l’or', 2], ['l’armée', 0], ['les cordes', 1], ['les singes', 1],
                   ['la marmite', 1], ['l’épée', 0], ['les deux filles', 1], ['le roi', 2], ['le jeune baron', 0], ['les jésuites', 0]]},
        {'label': L[3], 'title': 'QCM : je comprends', 'items': [
            qcm('Pourquoi le jeune baron refuse-t-il le mariage ?', ['Candide est pauvre.', 'Candide n’est pas noble.', 'Candide est jésuite.'], 1, [15, 3]),
            qcm('Pourquoi les Oreillons libèrent-ils Candide ?', ['Il a tué un jésuite.', 'Il leur donne de l’or.', 'Il parle leur langue.'], 0, [16, 4]),
            qcm('Pourquoi Candide quitte-t-il l’Eldorado ?', ['Le roi le chasse.', 'Il veut retrouver Cunégonde.', 'Il n’aime pas la nourriture.'], 1, [18, 4])]},
    ]},
    {'n': 4, 'chapters': [19, 20, 21, 22, 23, 24], 'sections': [
        {'label': L[0], 'title': 'Vrai ou faux ?', 'items': [
            vf('À Surinam, Candide rencontre un esclave.', True, [19, 2]),
            vf('Martin est très optimiste.', False, [20, 1]),
            vf('Candide retrouve un mouton dans la mer.', True, [20, 4]),
            vf('À Paris, Candide ne perd pas d’argent.', False, [22, 3]),
            vf('En Angleterre, on tue un amiral.', True, [23, 2]),
            vf('À Venise, Cacambo arrive tout de suite.', False, [24, 1])]},
        {'label': L[1], 'title': 'QCM : je retrouve', 'items': [
            qcm('Qui part chercher Cunégonde ?', ['Martin', 'Cacambo', 'Pangloss'], 1, [19, 4]),
            qcm('Qui vole les moutons de Candide ?', ['un marchand', 'un jésuite', 'un roi'], 0, [19, 5]),
            qcm('Que fait le public du théâtre à Paris ?', ['Il critique tout.', 'Il danse.', 'Il dort.'], 0, [22, 2])]},
        {'label': L[2], 'title': 'Tableau : je classe', 'type': 'sort', 'cats': ['À Surinam', 'À Paris', 'À Venise'],
         'hint': 'Pense au lieu où chaque chose apparaît pour la première fois : Martin, par exemple, est choisi à Surinam.',
         'items': [['Paquette', 2], ['le marchand voleur', 0], ['la place Saint-Marc', 2], ['le sucre', 0], ['frère Giroflée', 2], ['la gondole', 2],
                   ['la police', 1], ['les cartes', 1], ['Martin', 0], ['le théâtre', 1], ['l’esclave', 0], ['la fausse Cunégonde', 1]]},
        {'label': L[3], 'title': 'QCM : je comprends', 'items': [
            qcm('Pourquoi l’esclave a-t-il perdu une main et une jambe ?', ['Un accident de chasse', 'Il travaille pour le sucre des Européens.', 'Il a fait la guerre.'], 1, [19, 3]),
            qcm('Que veut dire Martin avec les éperviers ?', ['Les hommes ne changent pas.', 'Les oiseaux sont gentils.', 'Il faut chasser.'], 0, [21, 3]),
            qcm('Pourquoi tue-t-on l’amiral ?', ['Il a volé.', 'Il n’a pas assez combattu.', 'Il est espion.'], 1, [23, 2])]},
    ]},
    {'n': 5, 'chapters': [25, 26, 27, 28, 29, 30], 'sections': [
        {'label': L[0], 'title': 'Vrai ou faux ?', 'items': [
            vf('Pococurante est très riche.', True, [25, 1]),
            vf('Pococurante aime tout.', False, [25, 2]),
            vf('Les six étrangers sont des rois sans trône.', True, [26, 3]),
            vf('Pangloss et le jeune baron sont galériens.', True, [27, 3]),
            vf('À la fin, Cunégonde est toujours très belle.', False, [29, 2]),
            vf('À la fin, Candide épouse Cunégonde.', True, [30, 1])]},
        {'label': L[1], 'title': 'QCM : je retrouve', 'items': [
            qcm('Où Candide retrouve-t-il Cunégonde ?', ['à Paris', 'à Venise', 'près de Constantinople'], 2, [29, 1]),
            qcm('Qui travaille dans son jardin avec ses enfants ?', ['un vieux Turc', 'Martin', 'le baron'], 0, [30, 3]),
            qcm('Quelle est la dernière phrase du conte ?', ['« Tout est au mieux. »', '« Il faut cultiver notre jardin. »', '« Le monde est mauvais. »'], 1, [30, 5])]},
        {'label': L[2], 'title': 'Tableau : je classe', 'type': 'sort', 'cats': ['Chez Pococurante', 'Sur la galère', 'À la ferme'],
         'hint': 'Chez Pococurante, rien ne plaît et tout ennuie. À la ferme, chacun finit par travailler.',
         'items': [['le linge', 2], ['les forçats', 1], ['le travail', 2], ['l’ennui', 0], ['Pangloss', 1], ['la musique', 0],
                   ['les rames', 1], ['le jeune baron', 1], ['les livres', 0], ['le jardin', 2], ['la pâtisserie', 2], ['les tableaux', 0]]},
        {'label': L[3], 'title': 'QCM : je comprends', 'items': [
            qcm('Pourquoi Pococurante n’est-il pas heureux ?', ['Il est pauvre.', 'Il s’ennuie de tout.', 'Il est malade.'], 1, [25, 2]),
            qcm('Le travail éloigne trois grands maux. Lesquels ?', ['l’ennui, le vice, le besoin', 'la faim, la peur, la guerre', 'la pluie, le froid, la nuit'], 0, [30, 4]),
            qcm('Quelle est la leçon finale ?', ['Il faut voyager toujours.', 'Il faut travailler et être utile.', 'Il faut devenir riche.'], 1, [30, 5])]},
    ]},
]
