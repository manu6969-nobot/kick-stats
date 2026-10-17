# P4 Luxembourg — Stats Championnat

Site de statistiques pour le championnat provincial **P4 Luxembourg** (Belgique) : classement, calendrier / résultats, fiches équipes, stats domicile–extérieur, stats de match et classements joueurs.

Stack : **Next.js**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** — prêt pour **Vercel** + **GitHub**.

Sources Excel dans `data/` :
- `luxresdownP-4.xlsx` — calendrier (**16 équipes**, **30 journées**, **240 matchs**)
- `luxresdownP-5.xlsx` — résultats connus (scores intégrés, classement calculé)
- `effectifs_clubs.xlsx` — effectifs (**390 joueurs**)

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

## Déployer sur Vercel (via GitHub)

1. Créez un dépôt GitHub et poussez ce projet.
2. Sur [vercel.com](https://vercel.com) → **Add New Project** → importez le dépôt.
3. Framework : **Next.js** (détecté automatiquement). Laissez les commandes par défaut (`npm run build`).
4. Cliquez sur **Deploy**. Chaque push sur `main` redéploie le site.

Aucune variable d’environnement n’est requise pour la démo.

## Scripts

```bash
npm run dev      # développement
npm run build    # build production
npm run start    # servir le build
npm run lint     # ESLint
```
