// Suppression d'un contact (Lot 5), en deux temps :
// ask=1      → ouvre la confirmation (redirection ?confirm=<id>),
// confirmed=1 → supprime vraiment, après confirmation à l'écran.

import { redirect } from "next/navigation";
import { getContactsService } from "@/server/data/contacts-service";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");

  if (!id) {
    redirect("/admin/contacts?error=Contact%20introuvable.");
  }
  if (form.get("ask")) {
    redirect(`/admin/contacts?confirm=${encodeURIComponent(id)}`);
  }

  try {
    await (await getContactsService()).deleteContact(id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";
    redirect(`/admin/contacts?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/contacts?deleted=1");
}
