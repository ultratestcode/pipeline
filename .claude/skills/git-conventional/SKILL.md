---
name: git-conventional
description: Écrit et vérifie les messages de commit au format Conventional Commits. À utiliser avant chaque commit, ou quand on demande un message de commit.
---

# git-conventional · des commits lisibles

## Le format

```
<type>[(portée)]: <description>

[corps, facultatif]

[pied, facultatif : BREAKING CHANGE: …]
```

## Les types

| Type | Pour |
|---|---|
| `feat` | une fonctionnalité |
| `fix` | une correction de bug |
| `docs` | la documentation seule |
| `style` | la mise en forme, sans changer le comportement |
| `refactor` | une réécriture, sans changer le comportement |
| `perf` | une amélioration de performance |
| `test` | des tests ajoutés ou modifiés |
| `build` | le build ou les dépendances |
| `ci` | la configuration de la CI |
| `chore` | la maintenance, l'outillage |
| `revert` | l'annulation d'un commit |

## Les règles

- Le type est l'un de ceux du tableau.
- La portée est facultative, en minuscules : lettres, chiffres, tirets. Prends le nom d'une couche ou d'un dossier du projet : `app` (présentation, `src/app/`), `domain`, `services`, `data` (`src/server/…`), `tests`, `docs`, `deps`.
- La description commence par une minuscule, à l'impératif (« add », « ajoute »), sans point final, 100 caractères au plus.
- Un changement qui casse la compatibilité : `!` après le type (`feat!:`) et un pied `BREAKING CHANGE:` qui dit quoi faire.
- Un commit = un changement. Deux changements sans rapport : deux commits.

## Exemples

```
feat(auth): ajoute la connexion par lien magique
fix(api): corrige le délai d'expiration des requêtes météo
chore(deps): met à jour next en 15.2
```

Refusés : `Ajout de la page` (pas de type), `feat ajoute la page` (pas de deux-points), `feat(UI): ajoute la page` (portée en majuscules), `feat: Ajoute la page.` (majuscule et point final).
