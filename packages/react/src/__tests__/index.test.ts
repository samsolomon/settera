import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, useSettingsPlaceholder } from "../index.js";

describe("@settara/react", () => {
  it("re-exports SCHEMA_VERSION from schema", () => {
    expect(SCHEMA_VERSION).toBe("0.0.0");
  });

  it("exports useSettingsPlaceholder hook", () => {
    expect(useSettingsPlaceholder()).toBe("useSettingsPlaceholder");
  });
});
