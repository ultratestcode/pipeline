// Implémentation libsql/SQLite du port ContactsRepository.

import { randomUUID } from "node:crypto";
import type { Client, Row } from "@libsql/client";
import {
  FIRST_STAGE,
  isStage,
  type Contact,
  type NewContactInput,
  type Stage,
} from "@/server/domain/contacts";
import type {
  ContactFields,
  ContactsRepository,
} from "@/server/services/contacts";

function rowToContact(row: Row): Contact {
  const rawStage = row.stage;
  if (!isStage(rawStage)) {
    throw new Error(`Étape inconnue en base : ${String(rawStage)}`);
  }
  return {
    id: String(row.id),
    name: String(row.name),
    email: row.email == null ? null : String(row.email),
    company: row.company == null ? null : String(row.company),
    stage: rawStage,
    followUpAt: row.follow_up_at == null ? null : String(row.follow_up_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

const SELECT_CONTACT =
  "SELECT id, name, email, company, stage, follow_up_at, created_at, updated_at FROM contacts";

export class LibsqlContactsRepository implements ContactsRepository {
  constructor(private readonly db: Client) {}

  async list(): Promise<Contact[]> {
    const result = await this.db.execute(
      `${SELECT_CONTACT} ORDER BY created_at`,
    );
    return result.rows.map(rowToContact);
  }

  async add(input: NewContactInput): Promise<Contact> {
    const now = new Date().toISOString();
    const contact: Contact = {
      id: randomUUID(),
      name: input.name,
      email: input.email ?? null,
      company: input.company ?? null,
      stage: FIRST_STAGE,
      followUpAt: input.followUpAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.execute({
      sql: "INSERT INTO contacts (id, name, email, company, stage, follow_up_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        contact.id,
        contact.name,
        contact.email,
        contact.company,
        contact.stage,
        contact.followUpAt,
        contact.createdAt,
        contact.updatedAt,
      ],
    });
    return contact;
  }

  async getById(id: string): Promise<Contact | null> {
    const result = await this.db.execute({
      sql: `${SELECT_CONTACT} WHERE id = ?`,
      args: [id],
    });
    const row = result.rows[0];
    return row ? rowToContact(row) : null;
  }

  async setStage(id: string, stage: Stage): Promise<void> {
    await this.db.execute({
      sql: "UPDATE contacts SET stage = ?, updated_at = ? WHERE id = ?",
      args: [stage, new Date().toISOString(), id],
    });
  }

  async update(id: string, fields: ContactFields): Promise<void> {
    await this.db.execute({
      sql: "UPDATE contacts SET name = ?, email = ?, company = ?, updated_at = ? WHERE id = ?",
      args: [
        fields.name,
        fields.email,
        fields.company,
        new Date().toISOString(),
        id,
      ],
    });
  }
}
