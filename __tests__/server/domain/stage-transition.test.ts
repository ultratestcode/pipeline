// Règle métier du Lot 2 : la séquence stricte des étapes.
// Domaine pur : aucune base, aucune UI.

import { describe, expect, it } from "vitest";
import {
  NEXT_STAGES,
  validateStageTransition,
  type Stage,
} from "@/server/domain/contacts";

describe("validateStageTransition — suite de la séquence", () => {
  it("accepte chaque pas de la séquence", () => {
    expect(validateStageTransition("new", "contacted").ok).toBe(true);
    expect(validateStageTransition("contacted", "proposal").ok).toBe(true);
    expect(validateStageTransition("proposal", "won").ok).toBe(true);
    expect(validateStageTransition("proposal", "lost").ok).toBe(true);
  });

  it("refuse une transition hors séquence (nouveau → gagné)", () => {
    const result = validateStageTransition("new", "won");
    expect(result.ok).toBe(false);
    expect(String((result as { error: string }).error)).toMatch(
      /Transition interdite/,
    );
    expect(validateStageTransition("new", "proposal").ok).toBe(false);
    expect(validateStageTransition("contacted", "won").ok).toBe(false);
  });

  it("refuse toute transition depuis une étape terminale", () => {
    for (const to of ["new", "contacted", "proposal", "lost"] as Stage[]) {
      const result = validateStageTransition("won", to);
      expect(result.ok).toBe(false);
      expect(String((result as { error: string }).error)).toMatch(/terminale/);
    }
    expect(validateStageTransition("lost", "new").ok).toBe(false);
  });

  it("refuse de rester à la même étape", () => {
    expect(validateStageTransition("new", "new").ok).toBe(false);
  });
});

describe("NEXT_STAGES — étapes suivantes autorisées", () => {
  it("proposé a deux issues, gagné et perdu aucune", () => {
    expect(NEXT_STAGES.new).toEqual(["contacted"]);
    expect(NEXT_STAGES.contacted).toEqual(["proposal"]);
    expect(NEXT_STAGES.proposal).toEqual(["won", "lost"]);
    expect(NEXT_STAGES.won).toEqual([]);
    expect(NEXT_STAGES.lost).toEqual([]);
  });
});
