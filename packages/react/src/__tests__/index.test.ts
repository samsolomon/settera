import { describe, it, expect } from "vitest";
import {
  SCHEMA_VERSION,
  SetteraProvider,
  SetteraRenderer,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraNavigation,
  useSetteraSearch,
  useRovingTabIndex,
  useSetteraGlobalKeys,
  evaluateVisibility,
  validateSettingValue,
  SetteraSchemaContext,
  SetteraNavigationContext,
  SetteraValuesContext,
} from "../index.js";

describe("@settera/react", () => {
  it("re-exports SCHEMA_VERSION as 1.0", () => {
    expect(SCHEMA_VERSION).toBe("1.0");
  });

  it("exports SetteraProvider", () => {
    expect(typeof SetteraProvider).toBe("function");
  });

  it("exports SetteraRenderer", () => {
    expect(typeof SetteraRenderer).toBe("function");
  });

  it("exports hooks", () => {
    expect(typeof useSettera).toBe("function");
    expect(typeof useSetteraSetting).toBe("function");
    expect(typeof useSetteraAction).toBe("function");
    expect(typeof useSetteraNavigation).toBe("function");
    expect(typeof useSetteraSearch).toBe("function");
  });

  it("exports keyboard navigation hooks", () => {
    expect(typeof useRovingTabIndex).toBe("function");
    expect(typeof useSetteraGlobalKeys).toBe("function");
  });

  it("exports evaluateVisibility", () => {
    expect(typeof evaluateVisibility).toBe("function");
  });

  it("exports validateSettingValue", () => {
    expect(typeof validateSettingValue).toBe("function");
  });

  it("exports contexts", () => {
    expect(SetteraSchemaContext).toBeDefined();
    expect(SetteraNavigationContext).toBeDefined();
    expect(SetteraValuesContext).toBeDefined();
  });
});
