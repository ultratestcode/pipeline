// Couche données : seul endroit du projet qui parle à la base.
// Dev : fichier SQLite local. Prod (plus tard) : Turso via url/authToken —
// seul ce fichier changera à la migration.

import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "pipeline.db");

// Choix du moteur, seul endroit du projet où il se décide (règle données).
// Turso dès que TURSO_URL est posé (prod Vercel) ; sinon fichier local
// (dev et tests) — « passer à une base managée ne modifie que la couche
// données » (INTENT.md).
export type DbConfig =
  | { kind: "file"; path: string }
  | { kind: "turso"; url: string; authToken?: string };

type DbEnv = { [key: string]: string | undefined };

export function resolveDbConfig(env: DbEnv = process.env): DbConfig {
  const url = env.TURSO_URL?.trim();
  if (url) {
    return { kind: "turso", url, authToken: env.TURSO_AUTH_TOKEN?.trim() };
  }
  return { kind: "file", path: env.PIPELINE_DB_PATH ?? DEFAULT_DB_PATH };
}

export function openDb(env?: Parameters<typeof resolveDbConfig>[0]): Client {
  const config = resolveDbConfig(env);
  if (config.kind === "turso") {
    return createClient({ url: config.url, authToken: config.authToken });
  }
  return openLocalDb(config.path);
}

export function openLocalDb(
  dbPath = process.env.PIPELINE_DB_PATH ?? DEFAULT_DB_PATH,
): Client {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  return createClient({ url: `file:${dbPath}` });
}

export async function initSchema(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      stage TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  // Ajout de colonne idempotent (Lot 3) : CREATE TABLE IF NOT EXISTS ne
  // modifie pas une table existante.
  const cols = await db.execute("PRAGMA table_info(contacts)");
  if (!cols.rows.some((row) => String(row.name) === "follow_up_at")) {
    await db.execute("ALTER TABLE contacts ADD COLUMN follow_up_at TEXT");
  }
}
