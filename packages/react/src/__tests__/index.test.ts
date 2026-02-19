import { describe, it, expect } from "vitest";
import {
  Settera,
  SetteraNavigation,
  SetteraNavigationContext,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraConfirm,
  useSetteraSection,
  useSetteraNavigation,
  useStoreSelector,
  useStoreSlice,
  SetteraSchemaContext,
  SetteraValuesContext,
  SetteraValuesStore,
} from "../index.js";

describe("@settera/react", () => {
  it("exports Settera", () => {
    expect(typeof Settera).toBe("function");
  });

  it("exports hooks", () => {
    expect(typeof useSettera).toBe("function");
    expect(typeof useSetteraSetting).toBe("function");
    expect(typeof useSetteraAction).toBe("function");
    expect(typeof useSetteraConfirm).toBe("function");
    expect(typeof useSetteraSection).toBe("function");
  });

  it("exports store selector hooks", () => {
    expect(typeof useStoreSelector).toBe("function");
    expect(typeof useStoreSlice).toBe("function");
  });

  it("exports contexts", () => {
    expect(SetteraSchemaContext).toBeDefined();
    expect(SetteraValuesContext).toBeDefined();
    expect(SetteraNavigationContext).toBeDefined();
  });

  it("exports SetteraValuesStore", () => {
    expect(typeof SetteraValuesStore).toBe("function");
  });

  it("exports navigation", () => {
    expect(typeof SetteraNavigation).toBe("function");
    expect(typeof useSetteraNavigation).toBe("function");
  });
});
