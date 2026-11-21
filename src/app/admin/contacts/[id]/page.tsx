// Écran de correction d'un contact (Lot 4) : formulaire pré-rempli, poste
// vers /api/contacts/update. Atteint depuis la liste par « Modifier ».
// Composants shadcn uniquement, design system « Comptoir ».

import { redirect } from "next/navigation";
import Link from "next/link";
import { getContactsService } from "@/server/data/contacts-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Rendu bloquant assumé (Cache Components) : la page lit la base.
export const instant = false;

function Field({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    </div>
  );
}

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let contact;
  try {
    contact = await (await getContactsService()).getContact(id);
  } catch {
    redirect("/admin/contacts?error=Contact%20introuvable.");
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold mb-6">Corriger un contact</h1>

      <Card>
        <CardHeader>
          <CardTitle>{contact.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/api/contacts/update"
            method="post"
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={contact.id} />
            <Field id="edit-name" name="name" label="Nom *" defaultValue={contact.name} required />
            <Field
              id="edit-email"
              name="email"
              label="Email"
              type="email"
              defaultValue={contact.email}
            />
            <Field
              id="edit-company"
              name="company"
              label="Société"
              defaultValue={contact.company}
            />
            <div className="flex gap-3">
              <Button type="submit">Enregistrer</Button>
              <Link href="/admin/contacts">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
