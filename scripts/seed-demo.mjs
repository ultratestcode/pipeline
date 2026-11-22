// Jeu de démonstration : couvre les cas d'usage de la liste (À relancer
// aujourd'hui, en retard, future, hors groupe, étapes terminales, recherche).
// Les écritures passent par l'API HTTP du serveur de dev — le vrai chemin
// présentation → service → données ; les lectures (existence, ids) sont en
// lecture seule sur la base active. Les deux modes sont gérés : SQLite local
// ou Turso, selon .env.local. Idempotent : un contact existant est ignoré.
//
// Usage : pnpm dev lancé, puis « node scripts/seed-demo.mjs »
// (BASE=http://127.0.0.1:3010 pour un autre port).

import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const BASE = process.env.BASE ?? "http://127.0.0.1:3000";

// .env.local : mêmes règles que Next (dernière valeur gagnante, # = commentaire).
const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trimStart().startsWith("#")) env[m[1]] = m[2];
  }
} catch {
  /* pas de .env.local : mode fichier par défaut */
}

const db = env.TURSO_URL
  ? createClient({ url: env.TURSO_URL, authToken: env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${env.PIPELINE_DB_PATH || "data/pipeline.db"}` });

const iso = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

async function post(path, fields) {
  await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });
}

async function addContact(name, email, company, followup, stages) {
  const found = await db.execute({
    sql: "SELECT id FROM contacts WHERE name = ?",
    args: [name],
  });
  if (found.rows.length > 0) {
    console.log(`  existant : ${name}`);
    return;
  }
  await post("/api/contacts", { name, email, company, followup });
  const created = await db.execute({
    sql: "SELECT id FROM contacts WHERE name = ?",
    args: [name],
  });
  const id = String(created.rows[0]?.id ?? "");
  for (const target of stages) {
    await post("/api/contacts/advance", { id, target });
  }
  console.log(
    `  ajouté   : ${name} (relance: ${followup || "aucune"}${
      stages.length ? `, étapes: ${stages.join(" → ")}` : ""
    })`,
  );
}

console.log(
  `Seed démo sur ${BASE} (${env.TURSO_URL ? "Turso" : "SQLite local"})`,
);
await addContact("Camille Ferrand", "camille@valois.fr", "Menuiserie Valois", iso(0), ["contacted"]);
await addContact("Marc Dufresne", "marc@ateliernord.fr", "Atelier Nord", iso(-1), []);
await addContact("Sophie Ravel", "sophie@cabinetravel.fr", "Cabinet Ravel", iso(5), []);
await addContact("Karim Benali", "karim@benali-sa.fr", "Benali SA", iso(-7), ["contacted", "proposal", "won"]);
await addContact("Léa Moreau", "lea@moreau-archi.fr", "Moreau Architecture", "", ["contacted", "proposal"]);
await addContact("Hugo Perez", "hugo@perezconseil.fr", "Pérez Conseil", "", ["contacted", "proposal", "lost"]);
await addContact("Menuiserie du Coin", "", "", "", []);
db.close();
console.log(`Voir ${BASE}/admin/contacts`);
