// Suite d'acceptation du Lot 5 « Retirer un contact de la liste »
// (docs/lots.md). Confirmation en deux temps, côté serveur : la demande
// (?confirm=) ne supprime rien, seule la confirmation confirmée supprime.
// TDD réel : rouge gardé avant l'implémentation.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "pipeline-lot5-"));
const dbPath = path.join(dir, "lot5.db");

beforeAll(() => {
  process.env.PIPELINE_DB_PATH = dbPath;
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

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

async function readBack(id: string) {
  const db = await openDb();
  const contact = await (await repoOn(db)).getById(id);
  db.close();
  return contact;
}

async function seedContact(name: string): Promise<string> {
  const db = await openDb();
  const created = await (await repoOn(db)).add({
    name,
    email: null,
    company: null,
  });
  db.close();
  return created.id;
}

function deleteRequest(fields: Record<string, string>): Request {
  return new Request("http://localhost/api/contacts/delete", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
}

describe("Lot 5 · Retirer un contact de la liste", () => {
  it("critère 1 — suppression confirmée : le contact disparaît de la base", async () => {
    const id = await seedContact("À retirer");

    const { POST } = await import("@/app/api/contacts/delete/route");
    // Étape 1 : la demande ouvre la confirmation, ne supprime pas.
    const ask = await POST(deleteRequest({ id, ask: "1" })).then(
      () => null,
      (e: unknown) => e as Error,
    );
    expect(
      decodeURIComponent(String((ask as { digest?: string }).digest)),
    ).toContain("confirm=");
    expect(await readBack(id)).not.toBeNull();

    // Étape 2 : la confirmation supprime.
    await expect(
      POST(deleteRequest({ id, confirmed: "1" })),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(await readBack(id)).toBeNull();
  });

  it("critère 2 — annuler la confirmation : rien ne change", async () => {
    const id = await seedContact("À laisser");

    const { POST } = await import("@/app/api/contacts/delete/route");
    await POST(deleteRequest({ id, ask: "1" })).catch(() => null);
    // Annuler = revenir sans revalider : aucun POST de confirmation émis.
    expect(await readBack(id)).not.toBeNull();
  });

  it("critère 3 — contact supprimé : ne revient pas après réouverture", async () => {
    const id = await seedContact("Poussière");

    const { POST } = await import("@/app/api/contacts/delete/route");
    await POST(deleteRequest({ id, confirmed: "1" })).catch(() => null);

    // Fermeture puis réouverture d'une connexion neuve sur le fichier.
    const check = await openDb();
    const stored = await (await repoOn(check)).list();
    check.close();
    expect(stored.map((c) => c.id)).not.toContain(id);
  });
});
