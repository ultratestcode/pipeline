// Suite d'acceptation du Lot 4 « Corriger un contact » (docs/lots.md).
// Un test par critère, sur vraie base SQLite temporaire. TDD réel :
// rouge gardé avant l'implémentation.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(path.join(tmpdir(), "pipeline-lot4-"));
const dbPath = path.join(dir, "lot4.db");

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

function updateRequest(fields: Record<string, string>): Request {
  return new Request("http://localhost/api/contacts/update", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
}

async function seedContact(name: string): Promise<string> {
  const db = await openDb();
  const created = await (
    await repoOn(db)
  ).add({ name, email: null, company: null });
  db.close();
  return created.id;
}

describe("Lot 4 · Corriger un contact", () => {
  it("critère 1 — correction valide : la base porte les nouvelles valeurs", async () => {
    const id = await seedContact("Camille");

    const { POST } = await import("@/app/api/contacts/update/route");
    await expect(
      POST(
        updateRequest({
          id,
          name: "Camille Ferrand",
          email: "camille@valois.fr",
          company: "Menuiserie Valois",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const after = await readBack(id);
    expect(after).toMatchObject({
      name: "Camille Ferrand",
      email: "camille@valois.fr",
      company: "Menuiserie Valois",
    });
  });

  it("critère 2 — email invalide : refusé, l'ancienne valeur reste", async () => {
    const id = await seedContact("Durand");
    const setup = await openDb();
    await (
      await repoOn(setup)
    ).update(id, {
      name: "Durand",
      email: "durand@exemple.fr",
      company: null,
    });
    setup.close();

    const { POST } = await import("@/app/api/contacts/update/route");
    const error = await POST(
      updateRequest({ id, name: "Durand", email: "pas-un-email", company: "" }),
    ).then(
      () => null,
      (e: unknown) => e as Error,
    );

    expect(error).toBeInstanceOf(Error);
    expect(
      decodeURIComponent(String((error as { digest?: string }).digest)),
    ).toContain("?error=");

    const after = await readBack(id);
    expect(after?.email).toBe("durand@exemple.fr");
  });

  it("critère 3 — enregistrer sans rien modifier : aucun effet visible", async () => {
    const id = await seedContact("Marguerite");

    const { POST } = await import("@/app/api/contacts/update/route");
    await expect(
      POST(updateRequest({ id, name: "Marguerite", email: "", company: "" })),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const db = await openDb();
    const all = await (await repoOn(db)).list();
    db.close();

    // Toujours une seule ligne pour ce contact, valeurs inchangées.
    const forId = all.filter((c) => c.id === id);
    expect(forId).toHaveLength(1);
    expect(forId[0]).toMatchObject({ name: "Marguerite", email: null });
  });
});
