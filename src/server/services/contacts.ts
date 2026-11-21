// Couche service : cas d'utilisation. Elle ne connaît la base que par
// l'interface ContactsRepository (implémentée par la couche données).

import {
  normalizeNewContactInput,
  validateStageTransition,
  type Contact,
  type NewContactInput,
  type Stage,
} from "@/server/domain/contacts";

export interface ContactsRepository {
  list(): Promise<Contact[]>;
  add(input: NewContactInput): Promise<Contact>;
  getById(id: string): Promise<Contact | null>;
  setStage(id: string, stage: Stage): Promise<void>;
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
}
