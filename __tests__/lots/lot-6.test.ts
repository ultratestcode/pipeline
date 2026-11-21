// Suite d'acceptation du Lot 6 « Retrouver un contact d'un coup d'œil »
// (docs/lots.md). Sur vraie base SQLite temporaire. TDD réel : rouge gardé
// avant l'implémentation.
// Lecture honnête : l'écran ne retient rien, il ne lit que ?stage= et ?q= ;
// le critère « recharger l'URL rejoue le filtre » est donc prouvé par la
// détermination du résultat à partir des seuls paramètres (deux appels).

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { normalizeContactFilter, type Stage } from "@/server/domain/contacts";

const dir = mkdtempSync(path.join(tmpdir(), "pipeline-lot6-"));
const dbPath = path.join(dir, "lot6.db");

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

async function seed(
  name: string,
  company: string | null,
  stage: Stage,
): Promise<void> {
  const db = await openDb();
  const { LibsqlContactsRepository } = await import(
    "@/server/data/contacts-repo"
  );
  const repo = new LibsqlContactsRepository(db);
  const created = await repo.add({ name, email: null, company });
  if (stage !== "new") {
    await repo.setStage(created.id, stage);
  }
  db.close();
}

async function search(rawStage?: string, rawQ?: string): Promise<string[]> {
  const { getContactsService } = await import(
    "@/server/data/contacts-service"
  );
  const filter = normalizeContactFilter({ stage: rawStage, q: rawQ });
  const found = await (await getContactsService()).searchContacts(filter);
  return found.map((c) => c.name);
}

describe("Lot 6 · Retrouver un contact d'un coup d'œil", () => {
  beforeAll(async () => {
    await seed("Camille Ferrand", "Menuiserie Valois", "contacted");
    await seed("Marc Dufresne", "Atelier Nord", "new");
    await seed("Sophie Ravel", "Cabinet Ravel", "won");
    await seed("Menuiserie du Coin", null, "new");
  });

  it("critère 1 — filtre sur « contacté » : seuls ceux-ci s'affichent", async () => {
    expect(await search("contacted")).toEqual(["Camille Ferrand"]);
  });

  it("critère 2 — recherche « menuiserie » : nom ou société, insensible à la casse", async () => {
    const found = await search(undefined, "menuiserie");
    expect(found.sort()).toEqual(
      ["Camille Ferrand", "Menuiserie du Coin"].sort(),
    );
  });

  it("critère 3 — recharger l'URL avec les paramètres rejoue le même filtre", async () => {
    const first = await search("new", "atelier");
    const reload = await search("new", "atelier");
    expect(reload).toEqual(first);
    expect(first).toEqual(["Marc Dufresne"]);
    // Le même nom hors étape n'est plus visible : les deux paramètres agissent.
    expect(await search("won", "atelier")).toEqual([]);
  });
});
