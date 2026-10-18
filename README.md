# P1 Luxembourg — Stats Championnat

Site de statistiques pour le championnat provincial **P1 Luxembourg** (Belgique) : classement, calendrier / résultats, fiches équipes, stats domicile–extérieur, stats de match et classements joueurs.

Stack : **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** — prêt pour **Vercel** + **GitHub**.

Sources Excel dans `data/` :
- `luxresdownP-4.xlsx` — calendrier (**16 équipes**, **30 journées**, **240 matchs**)
- `luxresdownP-5.xlsx` — résultats connus (scores intégrés, classement calculé)
- `effectifs_clubs.xlsx` — effectifs (**390 joueurs**)

## Extraire les résultats depuis RBFA (rbfa.be)

Les scores, buteurs et cartons de la **1re Provinciale Luxembourg** sont récupérés via l’API GraphQL publique de la RBFA (série `CHP_131416`), puis convertis au format `data/live-results.json`.

```bash
# 1. Télécharge calendrier + détails des matchs terminés (~2 min)
npm run rbfa:extract

# 2. Produit data/live-results.from-rbfa.json
#    et avec --apply fusionne dans data/live-results.json :
npm run rbfa:apply

# Si le dump brut existe déjà (data/rbfa-raw.json) :
npm run rbfa:remap
```

Fichiers produits :
| Fichier | Rôle |
|---------|------|
| `data/live-results.from-rbfa.json` | JSON injectable (scores + événements) |
| `data/rbfa-team-map.json` | Correspondance clubs RBFA ↔ ids kick-stats |
| `data/rbfa-raw.json` | Dump brut (gitignoré, régénérable) |

Exemple : Assenois–Bercheux (`m1`) → `8-1` avec buts/cartons à la minute, liés aux joueurs du site quand le nom correspond.

## Lancer en local

```bash
npm install
npm run dev
```

Ouvrez [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Personnaliser vos données

Tout le contenu métier est dans un seul fichier :

```
src/data/championship.ts
```

Vous pouvez y modifier :

- le nom du championnat et la saison (`meta`)
- les **équipes** (ville, stade, couleurs, coach)
- les **joueurs** (numéro, poste, nationalité) — liste vide pour l’instant
- les **matchs** : passez `status` à `"finished"` et ajoutez `homeScore` / `awayScore` (+ `events`, `stats`)
- les **stats saison** des joueurs (`playerStats`)

Le classement général et les tableaux domicile / extérieur sont **calculés automatiquement** à partir des matchs terminés.

## Pages

| Route | Contenu |
|-------|---------|
| `/` | Accueil : classement, buteurs, derniers résultats, prochains matchs |
| `/classement` | Classement général + domicile + extérieur |
| `/calendrier` | Toutes les journées |
| `/equipes` / `/equipes/[id]` | Clubs et fiches |
| `/joueurs` / `/joueurs/[id]` | Buteurs, passeurs, fiches |
| `/matchs/[id]` | Feuille de match + stats détaillées |

## Admin (saisie des résultats)

Page : [`/admin`](http://127.0.0.1:43123/admin)

- Mot de passe par défaut : `p1admin`
- Sur Vercel, définissez la variable d’environnement `ADMIN_PASSWORD`
- Encodez score, buteurs (minute), passes, cartons jaunes / rouges
- **2 jaunes = rouge** : le 2e jaune du même joueur devient automatiquement « 2e jaune (rouge) », distinct du rouge direct
- Les données sont dans `data/live-results.json`
- **Sur Vercel, `GITHUB_TOKEN` est obligatoire** pour que le calendrier / classement / fiches match voient les scores. Sans token, l’admin enregistre seulement sur une machine éphémère : les autres pages ne changent pas.

### Publier automatiquement (obligatoire sur Vercel)

1. Projet **`kick-stats`** uniquement (supprimez les doublons)
2. **Settings** → **Environment Variables** :

| Variable | Valeur |
|---|---|
| `ADMIN_PASSWORD` | votre mot de passe admin |
| `GITHUB_TOKEN` | Personal Access Token GitHub (cochez **repo**) |
| `GITHUB_REPO` | `manu6969-nobot/kick-stats` |

3. **Deployments** → **⋯** → **Redeploy**

Ensuite **Enregistrer le score** écrit sur GitHub et **toutes les pages** (calendrier, classement, match) se mettent à jour immédiatement.

## Déployer sur Vercel (via GitHub)

1. Créez un dépôt GitHub et poussez ce projet.
2. Sur [vercel.com](https://vercel.com) → **Add New Project** → importez le dépôt.
3. Framework : **Next.js** (détecté automatiquement). Laissez les commandes par défaut (`npm run build`).
4. Cliquez sur **Deploy**. Chaque push sur `main` redéploie le site.
5. Ajoutez `ADMIN_PASSWORD` (et idéalement `GITHUB_TOKEN`) dans les variables d’environnement.

## Scripts

```bash
npm run dev      # développement
npm run build    # build production
npm run start    # servir le build
npm run lint     # ESLint
```
