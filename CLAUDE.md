# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

Mini CRM de prospection mono-utilisateur. **`INTENT.md` à la racine fait autorité** sur le produit, l'architecture et le hors-périmètre (pas d'auth, pas de multi-util) : le lire avant toute évolution et ne pas le contredire.

Les décisions d'architecture sont dans `docs/decisions/` (ADR, format MADR) : lire l'ADR concerné avant de changer une brique, et ne pas reproposer une option qu'un ADR « accepted » a écartée.

## Commandes

```bash
pnpm dev            # serveur de dev (port 3000 ; next start occupe parfois le port → vérifier avec lsof)
pnpm build          # build de prod — À LANCER AVANT LES TESTS : Next 16 génère les route types au build
pnpm test           # vitest run
pnpm lint           # eslint
pnpm exec tsc --noEmit
pnpm vitest run __tests__/server/data/contacts-repo.test.ts  # un seul fichier
pnpm vitest run -t "survit à une fermeture"                    # un seul test
```

## Architecture : 3 couches, dépendances à sens unique

présentation → service → données. **Seul `src/server/data/` parle à la base.**

- `src/server/domain/` — types (`Contact`, `Stage`) et règles métier pures (validation, normalisation). Aucune import de la base ni de Next.
- `src/server/services/` — cas d'utilisation. Définit le **port** `ContactsRepository` (interface) ; il ne connaît la base que par ce port.
- `src/server/data/` — implémentation SQLite (`@libsql/client`) + câblage (`contacts-service.ts` : connexion unique par process, schéma idempotent). `db.ts` est le SEUL fichier à modifier pour migrer vers Turso (`file:` → `url:`+`authToken`).
- `src/app/` — UI. `admin/contacts/page.tsx` lit via le service ; `api/contacts/route.ts` écrit puis redirige (303).

La base locale est `data/pipeline.db` (gitignorée, surcharge par `PIPELINE_DB_PATH`). Le critère « les contacts survivent au redémarrage » est verrouillé par un test d'intégration qui insère, **ferme la connexion, rouvre le fichier** et vérifie (voir `contacts-repo.test.ts`) — le maintenir quand on ajoute des tables.

## Pièges propres à ce repo

- **Next 16 + `cacheComponents`** : `export const dynamic = "force-dynamic"` est interdit. Une page qui lit la base ou les `searchParams` au rendu doit déclarer `export const instant = false`. Voir `AGENTS.md` : ce Next diffère de celui des données d'entraînement — lire `node_modules/next/dist/docs/` avant d'utiliser une API qu'on croit connaître.
- Tests : tous dans `__tests__/` à la racine, arborescence miroir de `src/` (configuré dans `vitest.config.ts`). Les règles métier se testent avec un faux repository (pas de base) ; la persistance se teste sur **vraie base** dans un fichier temporaire — jamais de mock pour prouver la persistance.
- Git : on travaille sur la branche `dev` (défaut du repo), identité d'auteur locale `testcode`. Pas de commit ni de push sans demande explicite ; push ≠ merge dans `main`.
- Déploiement Vercel prévu mais non fait : en prod serverless, le fichier SQLite ne survivrait pas — Turso est la condition du critère de persistance en prod.
