// Règle métier du Lot 3 : qui est « à relancer ». Domaine pur, horloge injectée.
// Interprétation documentée : une étape terminale (gagné/perdu) n'est plus
// « en cours » — sa relance passée ne remonte plus dans le groupe.

import { describe, expect, it } from "vitest";
import {
  isDueForFollowUp,
  normalizeNewContactInput,
} from "@/server/domain/contacts";

const TODAY = "2026-11-21";

describe("isDueForFollowUp — groupe « À relancer »", () => {
  it("relance à aujourd'hui : dans le groupe", () => {
    expect(isDueForFollowUp("2026-11-21", "new", TODAY)).toBe(true);
  });

  it("relance passée : reste dans le groupe (retard visible)", () => {
    expect(isDueForFollowUp("2026-11-19", "contacted", TODAY)).toBe(true);
  });

  it("relance future : hors du groupe", () => {
    expect(isDueForFollowUp("2026-11-25", "contacted", TODAY)).toBe(false);
  });

  it("pas de date : hors du groupe", () => {
    expect(isDueForFollowUp(null, "new", TODAY)).toBe(false);
  });

  it("étape terminale : hors du groupe même en retard", () => {
    expect(isDueForFollowUp("2026-11-01", "won", TODAY)).toBe(false);
    expect(isDueForFollowUp("2026-11-01", "lost", TODAY)).toBe(false);
  });
});

describe("normalizeNewContactInput — date de relance", () => {
  it("accepte une date ISO valide", () => {
    const result = normalizeNewContactInput({
      name: "Camille",
      followUpAt: "2026-11-25",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.followUpAt).toBe("2026-11-25");
  });

  it("refuse une date malformée", () => {
    const result = normalizeNewContactInput({
      name: "Camille",
      followUpAt: "25/11/2026",
    });
    expect(result.ok).toBe(false);
  });

  it("absente ou vide : null", () => {
    const result = normalizeNewContactInput({ name: "Camille", followUpAt: " " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.followUpAt).toBeNull();
  });
});
