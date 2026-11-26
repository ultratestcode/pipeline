---
paths:
  - "src/server/data/**"
---

# Couche données

Seule la couche données parle à la base. Le client SQLite (`@libsql/client`)
n'est importé que dans `src/server/data/`, et `db.ts` est le seul fichier de
câblage de la connexion (migration Turso = lui seul).

## Comment vérifier
`grep -r "@libsql" src/` ne renvoie que des fichiers de `src/server/data/` ;
la persistance est prouvée sur vraie base (insert → fermeture → réouverture).
