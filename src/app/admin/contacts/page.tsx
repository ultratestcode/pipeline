// Liste des contacts lus depuis la base + formulaire d'ajout.
// Le formulaire poste vers /api/contacts : écriture réelle, puis redirect.
// Composants : design system « Comptoir » via shadcn (INTENT.md, Contraintes).

import { getContactsService } from "@/server/data/contacts-service";
import { NEXT_STAGES, type Stage } from "@/server/domain/contacts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Libellés d'affichage des étapes. Purement présentation : la couche
// service manipule uniquement les identifiants (new, contacted…).
const STAGE_LABELS: Record<Stage, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  proposal: "Proposition",
  won: "Gagné",
  lost: "Perdu",
};

// Le champ natif gagne l'id et le nom ; Label ne fait que le nommer.
function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required={required} />
    </div>
  );
}

// Page pilotée par les searchParams et la base : rendu bloquant assumé
// (exigé par Cache Components, à la place de l'ancien « force-dynamic »).
export const instant = false;

async function readSearchParams(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const added = params.added !== undefined;
  const advanced = params.advanced !== undefined;
  return { error, added, advanced };
}

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { error, added, advanced } = await readSearchParams(searchParams);
  const contacts = await (await getContactsService()).listContacts();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold mb-6">Contacts</h1>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded border border-destructive/40 bg-destructive/10 p-3 text-destructive"
        >
          {error}
        </p>
      ) : null}
      {added ? (
        <p className="mb-4 rounded border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
          Contact ajouté.
        </p>
      ) : null}
      {advanced ? (
        <p className="mb-4 rounded border border-accent-foreground/25 bg-accent p-3 text-accent-foreground">
          Étape mise à jour.
        </p>
      ) : null}

      <form
        action="/api/contacts"
        method="post"
        className="mb-8 grid gap-4"
      >
        <Field id="contact-name" name="name" label="Nom *" required />
        <Field id="contact-email" name="email" label="Email" type="email" />
        <Field id="contact-company" name="company" label="Société" />
        <Button type="submit" className="justify-self-start">
          Ajouter
        </Button>
      </form>

      {contacts.length === 0 ? (
        <p className="text-muted-foreground">Aucun contact pour le moment.</p>
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Société</TableHead>
                  <TableHead className="text-right">Étape</TableHead>
                  <TableHead className="text-right">Progresser</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="py-3 font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {contact.company ?? "—"}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Badge className="gap-1.5 bg-accent text-accent-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {STAGE_LABELS[contact.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {NEXT_STAGES[contact.stage].length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Terminal
                        </span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {NEXT_STAGES[contact.stage].map((next) => (
                            <form
                              key={next}
                              action="/api/contacts/advance"
                              method="post"
                            >
                              <input type="hidden" name="id" value={contact.id} />
                              <input
                                type="hidden"
                                name="target"
                                value={next}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                              >
                                → {STAGE_LABELS[next]}
                              </Button>
                            </form>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
