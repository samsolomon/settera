import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCompoundDraft } from "../hooks/useCompoundDraft.js";
import type { CompoundFieldDefinition } from "@settera/schema";

const fields: CompoundFieldDefinition[] = [
  { key: "host", type: "text", title: "Host", default: "localhost" },
  { key: "port", type: "number", title: "Port", default: 3000 },
  { key: "ssl", type: "boolean", title: "SSL" },
] as CompoundFieldDefinition[];

// Stable references for test values — avoids infinite re-render from
// render-phase sync when useMemo sees a new object reference each render.
const emptyValue = {};
const hostOnlyValue = { host: "original" };

describe("useCompoundDraft", () => {
  describe("non-draft mode (default)", () => {
    it("merges field defaults with provided value", () => {
      const { result } = renderHook(() =>
        useCompoundDraft({ host: "example.com" }, fields, vi.fn(), vi.fn()),
      );

      expect(result.current.effectiveValue).toEqual({
        host: "example.com",
        port: 3000,
      });
    });

    it("returns field defaults when value is empty object", () => {
      const { result } = renderHook(() =>
        useCompoundDraft({}, fields, vi.fn(), vi.fn()),
      );

      expect(result.current.effectiveValue).toEqual({
        host: "localhost",
        port: 3000,
      });
    });

    it("handles non-object value gracefully", () => {
      const { result } = renderHook(() =>
        useCompoundDraft(null, fields, vi.fn(), vi.fn()),
      );

      expect(result.current.effectiveValue).toEqual({
        host: "localhost",
        port: 3000,
      });
    });

    it("getFieldValue returns value for a field", () => {
      const { result } = renderHook(() =>
        useCompoundDraft({ host: "example.com" }, fields, vi.fn(), vi.fn()),
      );

      expect(result.current.getFieldValue(fields[0])).toBe("example.com");
      expect(result.current.getFieldValue(fields[1])).toBe(3000);
      expect(result.current.getFieldValue(fields[2])).toBeUndefined();
    });

    it("updateField calls setValue and validate immediately", () => {
      const setValue = vi.fn();
      const validate = vi.fn();
      const { result } = renderHook(() =>
        useCompoundDraft({ host: "localhost", port: 3000 }, fields, setValue, validate),
      );

      act(() => {
        result.current.updateField("port", 8080);
      });

      expect(setValue).toHaveBeenCalledWith({
        host: "localhost",
        port: 8080,
      });
      expect(validate).toHaveBeenCalledWith({
        host: "localhost",
        port: 8080,
      });
    });
  });

  describe("draft mode", () => {
    it("updateField accumulates changes locally without calling setValue", () => {
      const setValue = vi.fn();
      const validate = vi.fn();
      const { result } = renderHook(() =>
        useCompoundDraft(emptyValue, fields, setValue, validate, { draft: true }),
      );

      act(() => {
        result.current.updateField("host", "db.example.com");
      });

      expect(result.current.effectiveValue.host).toBe("db.example.com");
      expect(setValue).not.toHaveBeenCalled();
      expect(validate).not.toHaveBeenCalled();
    });

    it("commitDraft calls setValue and validate with accumulated changes", () => {
      const setValue = vi.fn();
      const validate = vi.fn();
      const { result } = renderHook(() =>
        useCompoundDraft(emptyValue, fields, setValue, validate, { draft: true }),
      );

      act(() => {
        result.current.updateField("host", "db.example.com");
        result.current.updateField("port", 5432);
      });

      act(() => {
        result.current.commitDraft();
      });

      expect(setValue).toHaveBeenCalledWith({
        host: "db.example.com",
        port: 5432,
      });
      expect(validate).toHaveBeenCalledWith({
        host: "db.example.com",
        port: 5432,
      });
    });

    it("resetDraft reverts to effective value", () => {
      const { result } = renderHook(() =>
        useCompoundDraft(hostOnlyValue, fields, vi.fn(), vi.fn(), { draft: true }),
      );

      act(() => {
        result.current.updateField("host", "changed");
      });
      expect(result.current.effectiveValue.host).toBe("changed");

      act(() => {
        result.current.resetDraft();
      });
      expect(result.current.effectiveValue.host).toBe("original");
    });

    it("syncs draft when external value changes", () => {
      const { result, rerender } = renderHook(
        ({ value }) =>
          useCompoundDraft(value, fields, vi.fn(), vi.fn(), { draft: true }),
        { initialProps: { value: { host: "a" } as unknown } },
      );

      expect(result.current.effectiveValue.host).toBe("a");

      rerender({ value: { host: "b" } });

      expect(result.current.effectiveValue.host).toBe("b");
    });
  });
});
