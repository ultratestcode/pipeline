# Lots · Pipeline

Un lot = une chose que l'utilisateur fait de bout en bout, de l'écran à la
base (présentation → service → données, chemins définis par les règles de
`.claude/rules/`). Les étapes forment une séquence stricte :
`nouveau → contacté → proposition → gagné / perdu`, `gagné` et `perdu` étant
terminaux (« je les fais avancer d'étape en étape », INTENT.md).
Hors périmètre rappelé par INTENT.md : pas d'authentification, pas de droits,
pas de multi-utilisateur — aucun lot n'y touche.

## Lot 1 · Ajouter un contact — le plus petit, déjà livré

Depuis l'écran de liste, je saisis nom, email et société, je valide, et le
contact apparaît dans la liste et survit au redémarrage.

- Étant donné le formulaire vide, quand j'envoie un nom valide, alors le
  contact apparaît dans la liste et la ligne est écrite en base.
- Étant donné le formulaire, quand j'envoie sans nom, alors un bandeau
  d'erreur s'affiche et rien n'est écrit en base.
- Étant donné un contact ajouté, quand je ferme et rouvre la base, alors il
  est toujours listé.
- Étant donné un email malformé, quand j'envoie, alors le service le refuse.

Statut : livré sur `dev` (tranche contacts, commits `bb6bbb1`..`138124b`).

## Lot 2 · Faire avancer un contact d'une étape

Depuis la liste, je clique pour faire passer un contact à l'étape suivante ;
le badge change, la base est à jour, et une étape gagnée/perdu ne bouge plus.

- Étant donné un contact « nouveau », quand je clique « Contacté », alors son
  badge affiche « contacté » et la base est à jour.
- Étant donné un contact « gagné », quand je tente une transition, alors le
  service la refuse et rien ne change.
- Étant donné une transition hors séquence (nouveau → gagné), quand elle
  arrive au service, alors elle est rejetée par une règle métier testée.

## Lot 3 · Savoir qui relancer aujourd'hui — livré

J'attache une date de relance à un contact ; la liste me montre en tête ce
qui est dû aujourd'hui (retards compris), le reste après.
Interprétation retenue : « non traitée » = étape en cours — gagné/perdu ne
remonte plus dans « À relancer ».

- Étant donné un contact avec relance à aujourd'hui, quand j'ouvre la liste,
  alors il figure dans le groupe « À relancer ».
- Étant donné une relance passée non traitée, quand j'ouvre la liste, alors
  elle reste dans « À relancer » (retard visible).
- Étant donné une relance future, quand j'ouvre la liste, alors le contact
  est hors du groupe « À relancer ».
- Étant donné une date saisie, quand je recharge, alors elle est persistée.

## Lot 4 · Corriger un contact

Je corrige nom, email ou société depuis la liste ; les mêmes règles de
validation qu'à la création s'appliquent.

- Étant donné un contact, quand j'enregistre une correction valide, alors la
  liste affiche la nouvelle valeur et la base est à jour.
- Étant donné un email invalide en correction, quand j'enregistre, alors
  c'est refusé et l'ancienne valeur reste.
- Étant donné la fiche d'un contact, quand je n'ai rien modifié, alors
  l'enregistrement est sans effet visible (pas de doublon, pas d'erreur).

## Lot 5 · Retirer un contact de la liste

Je supprime un contact qui ne m'intéresse plus, après confirmation ; il
disparaît de la liste et de la base.

- Étant donné un contact, quand je confirme sa suppression, alors il
  disparaît de la liste et la ligne est supprimée en base.
- Étant donné la demande de suppression, quand j'annule la confirmation,
  alors rien ne change.
- Étant donné un contact supprimé, quand je redémarre l'app, alors il ne
  revient pas.

## Lot 6 · Retrouver un contact d'un coup d'œil

Je filtre la liste par étape et je cherche par nom ou société ; le filtre se
partage par l'URL.

- Étant donné plusieurs contacts, quand je filtre sur « contacté », alors
  seuls ceux-ci s'affichent.
- Étant donné une recherche « menuiserie », quand je l'applique, alors seuls
  les contacts dont le nom ou la société contiennent ce texte restent.
- Étant donné un filtre actif, quand je recharge l'URL avec le paramètre,
  alors le même filtre est appliqué.

## Pourquoi le lot 1 est le plus petit

Un seul écran, une seule écriture, zéro transition d'état ni date : c'est le
plus petit parcours complet, et il valide le socle (3 couches + persistance)
sur lequel les lots 2 à 6 s'empilent.
