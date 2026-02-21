import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSaveAndClose } from "../hooks/useSaveAndClose.js";

describe("useSaveAndClose", () => {
  describe("string status mode", () => {
    it("does not call onComplete before trigger", () => {
      const onComplete = vi.fn();
      renderHook(() => useSaveAndClose("idle", onComplete));

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("calls onComplete immediately for sync operation (status stays idle)", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useSaveAndClose("idle", onComplete),
      );

      act(() => {
        result.current.trigger();
      });

      expect(onComplete).toHaveBeenCalledOnce();
    });

    it("waits for saving→non-saving transition before calling onComplete", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(
        ({ status }) => useSaveAndClose(status, onComplete),
        { initialProps: { status: "idle" as string } },
      );

      // Trigger while idle
      act(() => {
        result.current.trigger();
      });
      // Sync: onComplete fires immediately since status is not "saving"
      expect(onComplete).toHaveBeenCalledOnce();
      onComplete.mockClear();

      // Now test async flow: trigger, then status goes to saving
      const { result: result2, rerender: rerender2 } = renderHook(
        ({ status }) => useSaveAndClose(status, onComplete),
        { initialProps: { status: "saving" as string } },
      );

      act(() => {
        result2.current.trigger();
      });
      // Still saving — should not complete yet
      expect(onComplete).not.toHaveBeenCalled();
      expect(result2.current.isBusy).toBe(true);

      // Status transitions to "saved"
      rerender2({ status: "saved" });

      expect(onComplete).toHaveBeenCalledOnce();
      expect(result2.current.isBusy).toBe(false);
    });

    it("calls onComplete when status goes from saving to error", () => {
      const onComplete = vi.fn();
      const { result, rerender } = renderHook(
        ({ status }) => useSaveAndClose(status, onComplete),
        { initialProps: { status: "saving" as string } },
      );

      act(() => {
        result.current.trigger();
      });
      expect(onComplete).not.toHaveBeenCalled();

      rerender({ status: "error" });

      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  describe("boolean loading mode", () => {
    it("calls onComplete when isLoading transitions from true to false", () => {
      const onComplete = vi.fn();
      const { result, rerender } = renderHook(
        ({ loading }) => useSaveAndClose(loading, onComplete),
        { initialProps: { loading: true } },
      );

      act(() => {
        result.current.trigger();
      });
      expect(onComplete).not.toHaveBeenCalled();
      expect(result.current.isBusy).toBe(true);

      rerender({ loading: false });

      expect(onComplete).toHaveBeenCalledOnce();
      expect(result.current.isBusy).toBe(false);
    });

    it("calls onComplete immediately for sync boolean (loading=false)", () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useSaveAndClose(false, onComplete),
      );

      act(() => {
        result.current.trigger();
      });

      expect(onComplete).toHaveBeenCalledOnce();
    });
  });

  describe("isBusy", () => {
    it("is false before trigger", () => {
      const { result } = renderHook(() =>
        useSaveAndClose("saving", vi.fn()),
      );

      expect(result.current.isBusy).toBe(false);
    });

    it("is true when triggered and status is saving", () => {
      const { result } = renderHook(() =>
        useSaveAndClose("saving", vi.fn()),
      );

      act(() => {
        result.current.trigger();
      });

      expect(result.current.isBusy).toBe(true);
    });

    it("is false when triggered but status is not saving", () => {
      const { result } = renderHook(() =>
        useSaveAndClose("idle", vi.fn()),
      );

      act(() => {
        result.current.trigger();
      });

      // trigger + idle = sync complete, so isBusy is false
      expect(result.current.isBusy).toBe(false);
    });
  });
});
