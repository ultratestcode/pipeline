// Correction d'un contact : POST /api/contacts/update (formulaire
// d'édition), mêmes règles qu'à la création, puis redirection.

import { redirect } from "next/navigation";
import { getContactsService } from "@/server/data/contacts-service";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "");
  const email = form.get("email") ? String(form.get("email")) : null;
  const company = form.get("company") ? String(form.get("company")) : null;

  if (!id) {
    redirect("/admin/contacts?error=Contact%20introuvable.");
  }

  try {
    await (await getContactsService()).updateContact(id, {
      name,
      email,
      company,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";
    redirect(`/admin/contacts?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/contacts?updated=1");
}
