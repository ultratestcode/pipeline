// Écriture réelle en base : POST /api/contacts (formulaire ou curl),
// puis redirection vers la liste.

import { redirect } from "next/navigation";
import { getContactsService } from "@/server/data/contacts-service";

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  let name = "";
  let email: string | null = null;
  let company: string | null = null;
  let followup: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    name = String(body.name ?? "");
    email = body.email == null ? null : String(body.email);
    company = body.company == null ? null : String(body.company);
    followup = body.followup == null ? null : String(body.followup);
  } else {
    const form = await request.formData();
    name = String(form.get("name") ?? "");
    email = form.get("email") ? String(form.get("email")) : null;
    company = form.get("company") ? String(form.get("company")) : null;
    followup = form.get("followup") ? String(form.get("followup")) : null;
  }

  try {
    await (await getContactsService()).addContact({
      name,
      email,
      company,
      followUpAt: followup,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue.";
    redirect(`/admin/contacts?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/contacts?added=1");
}
