import { describe, it, expect } from "vitest";
import { SCHEMA_VERSION, greet } from "../index.js";

describe("@settara/schema", () => {
  it("exports SCHEMA_VERSION", () => {
    expect(SCHEMA_VERSION).toBe("0.0.0");
  });

  it("greet returns greeting string", () => {
    expect(greet("World")).toBe("Hello, World! (schema v0.0.0)");
  });
});
