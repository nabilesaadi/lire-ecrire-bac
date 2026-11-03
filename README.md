# Lire et écrire au bac

Site éducatif pour le cycle qualifiant : lecture illustrée des œuvres au programme, quiz à rétroaction (indice, deuxième essai, correction), parcours progressif de production écrite argumentative, comptes élèves, devoirs et tableau de bord enseignant.

Conception pédagogique et contenus : Nabil Saadi, professeur de français, Tétouan.

## Fonctionnement

- **Sans configuration**, le site tourne en *mode démonstration* : toutes les données restent dans le navigateur (comptes de démonstration `prof` / `demo` et `eleve` / `demo`).
- **Avec Supabase**, les comptes et les réponses des élèves sont enregistrés en ligne. Il suffit de remplir `public/config.json` :

```json
{ "supabaseUrl": "https://xxxx.supabase.co", "supabaseAnonKey": "clé publique (anon / publishable)" }
```

## Mise en place de Supabase (une seule fois)

1. Créer un projet gratuit sur supabase.com.
2. SQL Editor → coller le contenu de `supabase/schema.sql` → Run.
3. Authentication → Sign In / Providers → Email : désactiver « Confirm email » (les élèves se connectent avec un identifiant, sans adresse e-mail).
4. Project Settings → API : copier l’URL du projet et la clé publique dans `public/config.json`.
5. Le code enseignant par défaut est `CRMEF-2026` (table `app_settings`, modifiable).

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # version de production dans dist/
```

Site en ligne : https://nabilesaadi.github.io/lire-ecrire-bac/

Hébergement : GitHub Pages (gratuit). La branche `gh-pages` contient le site compilé (`npm run build`, puis copie de `dist/` avec un fichier `.nojekyll`).
