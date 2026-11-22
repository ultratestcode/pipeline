// Composition des couches pour l'app : service + repository SQLite local.
// Une seule connexion par process, Initialisée une fois (schéma idempotent).

import { openDb, initSchema } from "@/server/data/db";
import { LibsqlContactsRepository } from "@/server/data/contacts-repo";
import { ContactsService } from "@/server/services/contacts";

let servicePromise: Promise<ContactsService> | null = null;

export function getContactsService(): Promise<ContactsService> {
  if (!servicePromise) {
    servicePromise = (async () => {
      const db = openDb();
      await initSchema(db);
      return new ContactsService(new LibsqlContactsRepository(db));
    })();
  }
  return servicePromise;
}
