// Couche domaine : types et règles métier, sans dépendance à la base ni à l'UI.

export const STAGES = ["new", "contacted", "proposal", "won", "lost"] as const;

export type Stage = (typeof STAGES)[number];

export const FIRST_STAGE: Stage = "new";

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  stage: Stage;
  followUpAt: string | null; // date ISO courte YYYY-MM-DD, ou null
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface NewContactInput {
  name: string;
  email?: string | null;
  company?: string | null;
  followUpAt?: string | null;
}

export type NormalizedContactInput = Required<
  Pick<NewContactInput, "name" | "followUpAt">
> &
  Pick<NewContactInput, "email" | "company">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FOLLOW_UP_RE = /^\d{4}-\d{2}-\d{2}$/;

// Normalise et valide une saisie ; renvoie une erreur lisible si invalide.
export function normalizeNewContactInput(
  input: NewContactInput,
):
  | { ok: true; value: NormalizedContactInput }
  | { ok: false; error: string } {
  const name = input.name?.trim() ?? "";
  if (!name) {
    return { ok: false, error: "Le nom du contact est obligatoire." };
  }
  const email = input.email?.trim() || null;
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, error: `Email invalide : ${email}` };
  }
  const company = input.company?.trim() || null;
  const followUpAt = input.followUpAt?.trim() || null;
  if (followUpAt && !FOLLOW_UP_RE.test(followUpAt)) {
    return {
      ok: false,
      error: `Date de relance invalide : ${followUpAt} (format attendu AAAA-MM-JJ).`,
    };
  }
  return { ok: true, value: { name, email, company, followUpAt } };
}

// Lot 3 : « À relancer » = date posée, due aujourd'hui ou en retard, et
// affaire encore en cours — une étape terminale n'est plus à relancer.
// Les dates ISO courtes se comparent lexicographiquement.
export function isDueForFollowUp(
  followUpAt: string | null,
  stage: Stage,
  today: string,
): boolean {
  if (!followUpAt) return false;
  if (NEXT_STAGES[stage].length === 0) return false;
  return followUpAt <= today;
}

export function isStage(value: unknown): value is Stage {
  return (STAGES as readonly unknown[]).includes(value);
}

// Séquence stricte (Lot 2) : chaque étape n'autorise que ses successeurs.
// « gagné » et « perdu » sont terminaux — la liste vide le dit aussi.
export const NEXT_STAGES: Record<Stage, Stage[]> = {
  new: ["contacted"],
  contacted: ["proposal"],
  proposal: ["won", "lost"],
  won: [],
  lost: [],
};

// Règle métier pure : la transition demandée est-elle dans la séquence ?
export function validateStageTransition(
  from: Stage,
  to: Stage,
): { ok: true } | { ok: false; error: string } {
  if (NEXT_STAGES[from].length === 0) {
    return {
      ok: false,
      error: `L'étape « ${from} » est terminale : le contact ne bouge plus.`,
    };
  }
  if (!NEXT_STAGES[from].includes(to)) {
    return {
      ok: false,
      error: `Transition interdite : ${from} → ${to}.`,
    };
  }
  return { ok: true };
}
