// Suite d'acceptation du Lot 2 « Faire avancer un contact d'une étape »
// (docs/lots.md). Un test par critère, sur vraie base SQLite dans un fichier
// temporaire — jamais de mock pour prouver la persistance.
// TDD réel : ces tests ont été écrits avant le code et leur sortie rouge a
// été gardée avant toute implémentation.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "pipeline-lot2-"));
const dbPath = path.join(dir, "lot2.db");

beforeAll(() => {
  // À poser avant le premier appel de getContactsService() (singleton lazy).
  process.env.PIPELINE_DB_PATH = dbPath;
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

// Ouvre un client distinct sur le même fichier : prouve que les lignes sont
// sur le disque, pas seulement en mémoire de la connexion du singleton.
async function openDb() {
  const { openLocalDb, initSchema } = await import("@/server/data/db");
  const db = openLocalDb(dbPath);
  await initSchema(db);
  return db;
}

async function repoOn(db: Awaited<ReturnType<typeof openDb>>) {
  const { LibsqlContactsRepository } = await import(
    "@/server/data/contacts-repo"
  );
  return new LibsqlContactsRepository(db);
}

function advanceRequest(fields: Record<string, string>): Request {
  return new Request("http://localhost/api/contacts/advance", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
}

// Ajoute un contact en base et renvoie son identifiant.
async function seedContact(name: string): Promise<string> {
  const db = await openDb();
  const repo = await repoOn(db);
  const created = await repo.add({ name, email: null, company: null });
  db.close();
  return created.id;
}

// Lit une ligne sur une connexion fraîche, puis la referme.
async function readBack(id: string) {
  const db = await openDb();
  const contact = await (await repoOn(db)).getById(id);
  db.close();
  return contact;
}

describe("Lot 2 · Faire avancer un contact d'une étape", () => {
  it("critère 1 — nouveau → « Contacté » : redirection et base à jour", async () => {
    const id = await seedContact("Camille Ferrand");

    const { POST } = await import("@/app/api/contacts/advance/route");
    // En dehors du runtime Next, redirect() lève une erreur à digest 303.
    await expect(
      POST(advanceRequest({ id, target: "contacted" })),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const after = await readBack(id);
    expect(after?.stage).toBe("contacted");
  });

  it("critère 2 — étape « gagné » : transition refusée, rien ne change", async () => {
    const id = await seedContact("Gagné d'avance");
    const setup = await openDb();
    await setup.execute({
      sql: "UPDATE contacts SET stage = 'won' WHERE id = ?",
      args: [id],
    });
    setup.close();

    const { POST } = await import("@/app/api/contacts/advance/route");
    const error = await POST(advanceRequest({ id, target: "lost" })).then(
      () => null,
      (e: unknown) => e as Error,
    );

    expect(error).toBeInstanceOf(Error);
    // La redirection cible porte ?error= (source du bandeau sur la liste).
    expect(
      decodeURIComponent(String((error as { digest?: string }).digest)),
    ).toContain("?error=");

    const after = await readBack(id);
    expect(after?.stage).toBe("won");
  });

  it("critère 3 — hors séquence (nouveau → gagné) : rejetée, la base ne bouge pas", async () => {
    const id = await seedContact("Brûleur d'étapes");

    const { POST } = await import("@/app/api/contacts/advance/route");
    const error = await POST(advanceRequest({ id, target: "won" })).then(
      () => null,
      (e: unknown) => e as Error,
    );

    expect(error).toBeInstanceOf(Error);
    expect(
      decodeURIComponent(String((error as { digest?: string }).digest)),
    ).toContain("?error=");

    const after = await readBack(id);
    expect(after?.stage).toBe("new");
  });
});
