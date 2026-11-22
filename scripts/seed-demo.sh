#!/usr/bin/env bash
# Jeu de démonstration : couvre les cas d'usage de la liste (À relancer
# aujourd'hui, en retard, future, hors groupe, étapes terminales, recherche).
# Passe par l'API HTTP du serveur de dev — le vrai chemin présentation →
# service → données, jamais d'écriture SQL directe. Idempotent : un contact
# qui existe déjà est ignoré.
#
# Usage : pnpm dev lancé sur le port 3000, puis « ./scripts/seed-demo.sh »
# (BASE=... pour un autre port).
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"
DB="${PIPELINE_DB_PATH:-data/pipeline.db}"

today=$(date +%Y-%m-%d)
yesterday=$(date -v-1d +%Y-%m-%d)
lastweek=$(date -v-7d +%Y-%m-%d)
nextweek=$(date -v+5d +%Y-%m-%d)

add_contact() { # nom email société relance "étapes,à,enchaîner(,) séparées par des espaces"
  local name="$1" email="$2" company="$3" followup="$4" stages="$5"
  if [[ "$(sqlite3 "$DB" "SELECT COUNT(*) FROM contacts WHERE name = '$name'")" != "0" ]]; then
    echo "  existant : $name"
    return
  fi
  curl -sf -o /dev/null -X POST "$BASE/api/contacts" \
    --data-urlencode "name=$name" \
    --data-urlencode "email=$email" \
    --data-urlencode "company=$company" \
    --data-urlencode "followup=$followup"
  local id
  id=$(sqlite3 "$DB" "SELECT id FROM contacts WHERE name = '$name'")
  for target in $stages; do
    curl -sf -o /dev/null -X POST "$BASE/api/contacts/advance" \
      --data-urlencode "id=$id" --data-urlencode "target=$target"
  done
  echo "  ajouté   : $name (relance: ${followup:-aucune}${stages:+, étapes: $stages})"
}

echo "Seed démo sur $BASE"
add_contact "Camille Ferrand" "camille@valois.fr" "Menuiserie Valois" "$today"     "contacted"
add_contact "Marc Dufresne"   "marc@ateliernord.fr" "Atelier Nord"    "$yesterday" ""
add_contact "Sophie Ravel"    "sophie@cabinetravel.fr" "Cabinet Ravel" "$nextweek" ""
add_contact "Karim Benali"    "karim@benali-sa.fr" "Benali SA"        "$lastweek"  "contacted proposal won"
add_contact "Léa Moreau"      "lea@moreau-archi.fr" "Moreau Architecture" ""       "contacted proposal"
add_contact "Hugo Perez"      "hugo@perezconseil.fr" "Pérez Conseil"  ""           "contacted proposal lost"
add_contact "Menuiserie du Coin" "" "" "" ""
echo "Voir $BASE/admin/contacts"
