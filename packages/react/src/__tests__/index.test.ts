import { describe, it, expect } from "vitest";
import {
  SetteraProvider,
  SetteraRenderer,
  Settera,
  useSettera,
  useSetteraSetting,
  useSetteraAction,
  useSetteraConfirm,
  useSetteraSection,
  useStoreSelector,
  useStoreSlice,
  SetteraSchemaContext,
  SetteraValuesContext,
  SetteraValuesStore,
} from "../index.js";

describe("@settera/react", () => {
  it("exports SetteraProvider", () => {
    expect(typeof SetteraProvider).toBe("function");
  });

  it("exports SetteraRenderer", () => {
    expect(typeof SetteraRenderer).toBe("function");
  });

  it("exports Settera (unified)", () => {
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
  });

  it("exports SetteraValuesStore", () => {
    expect(typeof SetteraValuesStore).toBe("function");
  });
});
