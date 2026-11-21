// Règle métier du Lot 6 : normalisation du filtre de liste (étape + texte).
// Domaine pur. Une étape inconnue n'est pas une erreur : elle ignore le
// filtre (un lien d'URL périmé doit afficher la liste, pas un écran rouge).

import { describe, expect, it } from "vitest";
import { normalizeContactFilter } from "@/server/domain/contacts";

describe("normalizeContactFilter", () => {
  it("conserve une étape valide", () => {
    expect(normalizeContactFilter({ stage: "contacted", q: "" })).toEqual({
      stage: "contacted",
      q: "",
    });
  });

  it("ignore une étape inconnue", () => {
    const filter = normalizeContactFilter({ stage: "en-attente", q: "x" });
    expect(filter.stage).toBeNull();
    expect(filter.q).toBe("x");
  });

  it("normalize le texte : trim, sans limite cachée", () => {
    expect(normalizeContactFilter({ q: "  menuiserie  " }).q).toBe(
      "menuiserie",
    );
  });

  it("absent : aucun filtre", () => {
    expect(normalizeContactFilter({})).toEqual({ stage: null, q: "" });
  });
});
