import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, UI_PLACEHOLDER } from "../index.js";

describe("@settara/ui", () => {
  it("re-exports SCHEMA_VERSION from schema via react", () => {
    expect(SCHEMA_VERSION).toBe("0.0.0");
  });

  it("exports UI_PLACEHOLDER", () => {
    expect(UI_PLACEHOLDER).toBe("SettaraUI");
  });
});
