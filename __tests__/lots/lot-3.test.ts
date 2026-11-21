// Suite d'acceptation du Lot 3 « Savoir qui relancer aujourd'hui »
// (docs/lots.md). Un test par critère, sur vraie base SQLite temporaire.
// TDD réel : tests écrits avant le code, rouge gardé avant implémentation.
// L'horloge du groupe « À relancer » est injectée (isDueForFollowUp) ; seule
// la fabrication des dates du test lit l'horloge réelle.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isDueForFollowUp } from "@/server/domain/contacts";

const dir = mkdtempSync(path.join(tmpdir(), "pipeline-lot3-"));
const dbPath = path.join(dir, "lot3.db");

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
const TODAY = isoDay(0);
const PAST = isoDay(-2);
const FUTURE = isoDay(3);

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

async function listContacts() {
  const { getContactsService } = await import("@/server/data/contacts-service");
  return (await getContactsService()).listContacts();
}

function addRequest(fields: Record<string, string>): Request {
  return new Request("http://localhost/api/contacts", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
  });
}

async function addContact(name: string, followup?: string): Promise<void> {
  const { POST } = await import("@/app/api/contacts/route");
  const fields: Record<string, string> = { name };
  if (followup) fields.followup = followup;
  await expect(POST(addRequest(fields))).rejects.toThrow(/NEXT_REDIRECT/);
}

// Ce que l'écran affiche dans le groupe « À relancer », dans son ordre.
function dueNames(contacts: Awaited<ReturnType<typeof listContacts>>): string[] {
  return contacts
    .filter((c) => isDueForFollowUp(c.followUpAt, c.stage, TODAY))
    .map((c) => c.name);
}

describe("Lot 3 · Savoir qui relancer aujourd'hui", () => {
  it("critère 1 — relance à aujourd'hui : dans le groupe « À relancer »", async () => {
    await addContact("Relance aujourdhui", TODAY);
    expect(dueNames(await listContacts())).toContain("Relance aujourdhui");
  });

  it("critère 2 — relance passée non traitée : reste dans le groupe", async () => {
    await addContact("Relance en retard", PAST);
    expect(dueNames(await listContacts())).toContain("Relance en retard");
  });

  it("critère 3 — relance future : hors du groupe", async () => {
    await addContact("Relance trop tôt", FUTURE);
    expect(dueNames(await listContacts())).not.toContain("Relance trop tôt");
  });

  it("critère 4 — date saisie : persistée après fermeture et réouverture", async () => {
    const db = await openDb();
    db.close();

    const check = await openDb();
    const { LibsqlContactsRepository } = await import(
      "@/server/data/contacts-repo"
    );
    const stored = await new LibsqlContactsRepository(check).list();
    check.close();

    const withDate = stored.find((c) => c.name === "Relance aujourdhui");
    expect(withDate?.followUpAt).toBe(TODAY);
  });
});
