// Transition d'étape : POST /api/contacts/advance (formulaire de la liste),
// service + règle de séquence, puis redirection vers la liste.

import { redirect } from "next/navigation";
import { getContactsService } from "@/server/data/contacts-service";
import { isStage } from "@/server/domain/contacts";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const target = String(form.get("target") ?? "");

  if (!id) {
    redirect("/admin/contacts?error=Contact%20introuvable.");
  }
  if (!isStage(target)) {
    redirect("/admin/contacts?error=Étape%20inconnue.");
  }

  try {
    await (await getContactsService()).advanceContact(id, target);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";
    redirect(`/admin/contacts?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/contacts?advanced=1");
}
