"""Clés de réponse des quiz du Vieux couple (déduites des résumés du diaporama ; points incertains signalés par « ? »).
vf : (réponse, (chapitre, idée)) ; n2/n4 : (indice de la bonne option, (chapitre, idée)) ; sort : mot -> indice de colonne."""
V, F = True, False

ANSWERS = {
    1: {
        'vf': [(F, (1, 2)), (V, (1, 1)), (F, (2, 1)), (V, (2, 1)), (V, (4, 1)), (F, (5, 1))],
        'n2': [(0, (1, 1)), (1, (1, 2)), (1, (2, 1)), (2, (5, 1))],
        'cats': ['Personnages', 'Lieux', 'Objets'],
        'sort': {'Talouqit': 0, 'le souk': 1, 'le cahier vert': 2, 'Hmad': 0, 'la mosquée haute': 1, 'le brasero': 2,
                 'le Mokhazni': 0, 'le cimetière': 1, 'le piège': 2, 'le Mokaddem': 0, 'Mazagan': 1, 'la lampe à carbure': 2},
        # ? Q3 (Hmad et le corbeau) et Q4 (familles nombreuses) : détails absents des résumés
        'n4': [(1, (2, 1)), (1, (4, 1)), (0, (4, 1)), (1, (1, 2))],
    },
    2: {
        'vf': [(F, (6, 1)), (F, (6, 1)), (V, (7, 1)), (F, (7, 2)), (V, (8, 1)), (V, (10, 1))],
        'n2': [(1, (6, 1)), (1, (7, 1)), (1, (7, 2)), (0, (9, 1))],
        'cats': ['La tradition', 'La modernité', 'La nature'],
        'sort': {'le moulin à main': 0, 'la minoterie': 1, 'la tempête': 2, 'les bijoux d’argent': 0, 'la voiture neuve': 1,
                 'le torrent': 2, 'le chemin de la montagne': 0, 'le car': 1, 'l’orage': 2, 'la poésie berbère': 0,
                 'le Spoutnik': 1, 'les oranges': 2},
        'n4': [(0, (9, 1)), (1, (9, 1)), (0, (10, 1)), (1, (10, 1))],
    },
    3: {
        'vf': [(F, (11, 1)), (F, (11, 1)), (F, (12, 1)), (V, (13, 1)), (V, (14, 1)), (V, (15, 1))],
        'n2': [(0, (11, 1)), (1, (14, 1)), (1, (14, 1)), (0, (15, 1))],
        'cats': ['Personnages', 'Objets modernes', 'Traditions'],
        'sort': {'Salem': 0, 'le transistor': 1, 'l’Ahwach': 2, 'l’adjudant': 0, 'la parabole': 1, 'la circoncision': 2,
                 'Amzil': 0, 'le groupe électrogène': 1, 'l’amlou': 2, 'Haj Lahcène': 0, 'la Chevrolet': 1, 'le thé à la menthe': 2},
        'n4': [(0, (11, 1)), (1, (14, 1)), (1, (16, 1)), (1, (16, 1))],
    },
    4: {
        'vf': [(F, (17, 1)), (F, (17, 1)), (V, (18, 1)), (V, (19, 1)), (F, (20, 1)), (V, (22, 1))],
        'n2': [(0, (18, 1)), (1, (19, 1)), (1, (21, 1)), (0, (21, 1))],
        'cats': ['Le Vieux', 'La vieille', 'L’imam'],
        # ? « aide la medersa » (le Vieux) et « écoute la radio d’Agadir » (la vieille)
        'sort': {'écrit la nuit': 0, 'garde ses pots en terre': 1, 'dirige la medersa': 2, 'refuse l’engrais': 0,
                 'plume les perdreaux': 1, 'lit le manuscrit': 2, 'achète un réchaud à gaz': 0, 'va à la minoterie': 1,
                 'cherche un mécène': 2, 'aide la medersa': 0, 'écoute la radio d’Agadir': 1, 'ne frappe pas ses élèves': 2},
        'hint': 'Relis les chapitres 17 à 22 : qui écrit, qui garde la maison, qui dirige la medersa ?',
        # ? Q1 (l’Ancêtre et le troupeau) et Q2 (la minoterie) : détails absents des résumés
        'n4': [(0, (19, 1)), (1, (17, 1)), (1, (21, 1)), (0, (21, 1))],
    },
    5: {
        'vf': [(V, (23, 1)), (V, (23, 1)), (F, (24, 1)), (V, (25, 1)), (F, (25, 1)), (F, (27, 1))],
        # Q2 : le schéma des relations indique « le Mokaddem lui prend son fusil » ; ? Q3 (le déjeuner apporté par Hmad)
        'n2': [(0, (23, 1)), (1, (24, 1)), (1, (25, 1)), (0, (27, 1))],
        'cats': ['Causes', 'Conséquences', 'Solutions du Vieux'],
        # ? « le Sahara avance » classé parmi les causes
        'sort': {'on coupe trop d’arbres': 0, 'des ânes abandonnés': 1, 'creuser plus profond': 2, 'le Sahara avance': 0,
                 'des villages vides': 1, 'garder ses terres': 2, 'il ne pleut plus': 0, 'les prix montent': 1,
                 'respecter la nature': 2, 'on ne respecte pas la nature': 0, 'l’exode vers les villes': 1, 'une bonne éducation': 2},
        'n4': [(0, (23, 1)), (1, (24, 1)), (0, (25, 1)), (1, (27, 1))],
    },
}
