// Tests unitaires des règles métier, avec un faux repository : aucune base.

import { describe, expect, it } from "vitest";
import type { Contact, NewContactInput, Stage } from "@/server/domain/contacts";
import {
  ContactsService,
  type ContactsRepository,
} from "@/server/services/contacts";

class FakeRepo implements ContactsRepository {
  saved: NewContactInput[] = [];
  contacts = new Map<string, Contact>();
  stageWrites: Array<{ id: string; stage: Stage }> = [];

  async list(): Promise<Contact[]> {
    return [];
  }

  async add(input: NewContactInput): Promise<Contact> {
    this.saved.push(input);
    const now = new Date().toISOString();
    return {
      id: "fake-id",
      name: input.name,
      email: input.email ?? null,
      company: input.company ?? null,
      stage: "new",
      createdAt: now,
      updatedAt: now,
    };
  }

  async getById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) ?? null;
  }

  async setStage(id: string, stage: Stage): Promise<void> {
    this.stageWrites.push({ id, stage });
  }

  // Fabrique un contact existant à une étape donnée pour les tests.
  seed(id: string, stage: Stage): void {
    const now = new Date().toISOString();
    this.contacts.set(id, {
      id,
      name: "Semé",
      email: null,
      company: null,
      stage,
      createdAt: now,
      updatedAt: now,
    });
  }
}

describe("ContactsService.addContact", () => {
  it("rejette un nom vide", async () => {
    const service = new ContactsService(new FakeRepo());
    await expect(service.addContact({ name: "   " })).rejects.toThrow(
      "Le nom du contact est obligatoire.",
    );
  });

  it("rejette un email invalide", async () => {
    const service = new ContactsService(new FakeRepo());
    await expect(
      service.addContact({ name: "Durand", email: "pas-un-email" }),
    ).rejects.toThrow(/Email invalide/);
  });

  it("normalise la saisie avant d'écrire", async () => {
    const repo = new FakeRepo();
    await new ContactsService(repo).addContact({
      name: "  Durand  ",
      email: "  ",
      company: undefined,
    });
    expect(repo.saved).toEqual([{ name: "Durand", email: null, company: null }]);
  });
});

describe("ContactsService.advanceContact", () => {
  it("écrit l'étape demandée pour une transition valide", async () => {
    const repo = new FakeRepo();
    repo.seed("c1", "new");
    await new ContactsService(repo).advanceContact("c1", "contacted");
    expect(repo.stageWrites).toEqual([{ id: "c1", stage: "contacted" }]);
  });

  it("refuse une transition hors séquence et n'écrit rien", async () => {
    const repo = new FakeRepo();
    repo.seed("c1", "new");
    await expect(
      new ContactsService(repo).advanceContact("c1", "won"),
    ).rejects.toThrow(/Transition interdite/);
    expect(repo.stageWrites).toEqual([]);
  });

  it("refuse une transition depuis une étape terminale", async () => {
    const repo = new FakeRepo();
    repo.seed("c1", "won");
    await expect(
      new ContactsService(repo).advanceContact("c1", "lost"),
    ).rejects.toThrow(/terminale/);
    expect(repo.stageWrites).toEqual([]);
  });

  it("refuse un contact inconnu", async () => {
    const repo = new FakeRepo();
    await expect(
      new ContactsService(repo).advanceContact("absent", "contacted"),
    ).rejects.toThrow(/Contact introuvable/);
    expect(repo.stageWrites).toEqual([]);
  });
});
