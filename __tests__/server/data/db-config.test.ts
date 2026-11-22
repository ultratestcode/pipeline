// Bascule SQLite local / Turso (INTENT.md : « passer à une base managée ne
// modifie que la couche données »). Le choix est une fonction pure de
// l'environnement, testable sans réseau ; la connexion réelle est prouvée
// ailleurs sur fichier SQLite (tests d'intégration).

import { describe, expect, it } from "vitest";
import { resolveDbConfig } from "@/server/data/db";

describe("resolveDbConfig", () => {
  it("sans TURSO_URL : fichier local, PIPELINE_DB_PATH respecté", () => {
    const config = resolveDbConfig({ PIPELINE_DB_PATH: "/tmp/x.db" });
    expect(config).toEqual({ kind: "file", path: "/tmp/x.db" });
  });

  it("avec TURSO_URL : client managé, jeton transmis", () => {
    const config = resolveDbConfig({
      TURSO_URL: "libsql://mono.app.turso.io",
      TURSO_AUTH_TOKEN: "jeton-de-test",
    });
    expect(config).toEqual({
      kind: "turso",
      url: "libsql://mono.app.turso.io",
      authToken: "jeton-de-test",
    });
  });

  it("TURSO_URL gagne sur PIPELINE_DB_PATH (la prod explicite l'emporte)", () => {
    const config = resolveDbConfig({
      PIPELINE_DB_PATH: "/tmp/x.db",
      TURSO_URL: "libsql://mono.app.turso.io",
    });
    expect(config.kind).toBe("turso");
  });

  it("TURSO_URL vide : compte comme absent (retour local)", () => {
    const config = resolveDbConfig({ TURSO_URL: "", PIPELINE_DB_PATH: "/tmp/x.db" });
    expect(config.kind).toBe("file");
  });
});
