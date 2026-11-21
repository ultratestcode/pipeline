// Couche service : cas d'utilisation. Elle ne connaît la base que par
// l'interface ContactsRepository (implémentée par la couche données).

import {
  normalizeNewContactInput,
  validateStageTransition,
  type Contact,
  type NewContactInput,
  type Stage,
} from "@/server/domain/contacts";

// Champs éditables d'un contact (Lot 4) : l'étape et la relance ont leur
// propre chemin, la correction porte sur l'identité.
export interface ContactFields {
  name: string;
  email: string | null;
  company: string | null;
}

export interface ContactsRepository {
  list(): Promise<Contact[]>;
  add(input: NewContactInput): Promise<Contact>;
  getById(id: string): Promise<Contact | null>;
  setStage(id: string, stage: Stage): Promise<void>;
  update(id: string, fields: ContactFields): Promise<void>;
  delete(id: string): Promise<void>;
}

export class ContactsService {
  constructor(private readonly repo: ContactsRepository) {}

  listContacts(): Promise<Contact[]> {
    return this.repo.list();
  }

  async addContact(input: NewContactInput): Promise<Contact> {
    const normalized = normalizeNewContactInput(input);
    if (!normalized.ok) {
      throw new Error(normalized.error);
    }
    return this.repo.add(normalized.value);
  }

  // Lot 2 : faire avancer un contact. La règle de séquence est vérifiée ici,
  // avant toute écriture ; le dépôt ne reçoit que des transitions valides.
  async advanceContact(id: string, target: Stage): Promise<Contact> {
    const contact = await this.repo.getById(id);
    if (!contact) {
      throw new Error("Contact introuvable.");
    }
    const transition = validateStageTransition(contact.stage, target);
    if (!transition.ok) {
      throw new Error(transition.error);
    }
    await this.repo.setStage(id, target);
    return { ...contact, stage: target };
  }

  // Lot 4 : lecture d'un contact pour l'écran de correction.
  async getContact(id: string): Promise<Contact> {
    const contact = await this.repo.getById(id);
    if (!contact) {
      throw new Error("Contact introuvable.");
    }
    return contact;
  }

  // Lot 4 : corriger l'identité d'un contact. Mêmes règles de validation
  // qu'à la création (normalisation partagée), aucune écriture si refus.
  async updateContact(
    id: string,
    input: NewContactInput,
  ): Promise<Contact> {
    const contact = await this.repo.getById(id);
    if (!contact) {
      throw new Error("Contact introuvable.");
    }
    const normalized = normalizeNewContactInput(input);
    if (!normalized.ok) {
      throw new Error(normalized.error);
    }
    const fields: ContactFields = {
      name: normalized.value.name,
      email: normalized.value.email ?? null,
      company: normalized.value.company ?? null,
    };
    await this.repo.update(id, fields);
    return { ...contact, ...fields };
  }

  // Lot 5 : retirer un contact. La confirmation est faite à l'écran, en
  // deux temps ; ici on vérifie seulement que la cible existe.
  async deleteContact(id: string): Promise<void> {
    const contact = await this.repo.getById(id);
    if (!contact) {
      throw new Error("Contact introuvable.");
    }
    await this.repo.delete(id);
  }
}
