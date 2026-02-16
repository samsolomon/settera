import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  SettaraProvider,
  SettaraRenderer,
  useSettara,
  useSettaraSetting,
  useSettaraAction,
  useSettaraNavigation,
  evaluateVisibility,
  validateSettingValue,
  SettaraSchemaContext,
  SettaraNavigationContext,
  SettaraValuesContext,
} from "../index.js";

describe("@settara/react", () => {
  it("re-exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("exports SettaraProvider", () => {
    expect(typeof SettaraProvider).toBe("function");
  });

  it("exports SettaraRenderer", () => {
    expect(typeof SettaraRenderer).toBe("function");
  });

  it("exports hooks", () => {
    expect(typeof useSettara).toBe("function");
    expect(typeof useSettaraSetting).toBe("function");
    expect(typeof useSettaraAction).toBe("function");
    expect(typeof useSettaraNavigation).toBe("function");
  });

  it("exports evaluateVisibility", () => {
    expect(typeof evaluateVisibility).toBe("function");
  });

  it("exports validateSettingValue", () => {
    expect(typeof validateSettingValue).toBe("function");
  });

  it("exports contexts", () => {
    expect(SettaraSchemaContext).toBeDefined();
    expect(SettaraNavigationContext).toBeDefined();
    expect(SettaraValuesContext).toBeDefined();
  });
});
