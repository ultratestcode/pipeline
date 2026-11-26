# ADR 001 — Interface en shadcn/ui + Tailwind v4, thème « Comptoir »

- Status: accepted
- Date: 2026-11-20
- Scope: framing

## Context
CRM mono-utilisateur, un seul développeur agentique. L'UI doit rester
sobre et cohérente sans designer dédié, et chaque composant doit être
modifiable en local (pas de dépendance opaque). Les règles de la couche
présentation (.claude/rules/presentation.md) exigent des tokens de rôles,
jamais de couleur en dur.

## Decision
Tailwind v4 (configuration CSS-first dans `src/app/globals.css`, pas de
`tailwind.config.js`) + composants shadcn/ui style « radix-nova », copiés
dans le repo sous `src/components/ui/`. Thème « Comptoir » défini par des
variables CSS (tokens de rôles : `bg-background`, `text-muted-foreground`…).
Icônes lucide, `class-variance-authority` pour les variantes.

## Considered options
- MUI/Ant Design — rejected because surdimensionné pour un CRM
  mono-utilisateur et impose sa propre esthétique, incompatible avec des
  tokens de rôles maison.
- CSS maison sans framework — rejected because recoller du style à la main
  exactement ce que la règle « pas d'élément brut stylé à la main » refuse.
- Composants payants (tremor, tailwind-plus) — rejected because licence et
  opacité ; shadcn est copié dans le repo, donc relisible et modifiable.

## Consequences
Les composants sont dans le repo : on les modifie librement, mais les mises
à jour amont se font à la main. Toute nouvelle couleur passe par
`globals.css` ; une couleur en dur dans `src/app/` est une entorse à la
règle présentation.
