---
paths:
  - "src/server/domain/**"
  - "src/server/services/**"
---

# Couche service

`src/server/domain/` porte les règles métier pures (validation, normalisation)
et `src/server/services/` les cas d'utilisation. Le port `ContactsRepository`
y est défini : cette couche ne connaît la base que par ce port.

Les tests d'une règle ou d'un cas d'usage sont écrits avant le code :
test rouge d'abord, implémentation ensuite.

## Comment vérifier
Aucun import de `@libsql/client` ni de `next/*` dans `src/server/services/`
et `src/server/domain/` ; dans l'historique git, le commit de test précède
le commit de code pour chaque règle.
