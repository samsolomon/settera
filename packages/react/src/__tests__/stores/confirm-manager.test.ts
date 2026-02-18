import { describe, it, expect, vi } from "vitest";
import { ConfirmManager } from "../../stores/confirm-manager.js";
import type { PendingConfirm } from "../../stores/confirm-manager.js";

function makePending(overrides: Partial<PendingConfirm> = {}): PendingConfirm {
  return {
    key: "testKey",
    config: { title: "Confirm?" },
    dangerous: false,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
}

describe("ConfirmManager", () => {
  it("starts with null pendingConfirm", () => {
    const mgr = new ConfirmManager(() => {});
    expect(mgr.getPendingConfirm()).toBeNull();
  });

  it("sets pending confirm and emits", () => {
    const emit = vi.fn();
    const mgr = new ConfirmManager(emit);
    const pending = makePending();
    mgr.requestConfirm(pending);
    expect(mgr.getPendingConfirm()).toBe(pending);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("cancels previous pending when requesting new one", () => {
    const mgr = new ConfirmManager(() => {});
    const first = makePending();
    const second = makePending();
    mgr.requestConfirm(first);
    mgr.requestConfirm(second);
    expect(first.onCancel).toHaveBeenCalled();
    expect(mgr.getPendingConfirm()).toBe(second);
  });

  it("resolves confirm — calls onConfirm and clears", () => {
    const emit = vi.fn();
    const mgr = new ConfirmManager(emit);
    const pending = makePending();
    mgr.requestConfirm(pending);
    mgr.resolveConfirm(true);
    expect(pending.onConfirm).toHaveBeenCalled();
    expect(pending.onCancel).not.toHaveBeenCalled();
    expect(mgr.getPendingConfirm()).toBeNull();
  });

  it("resolves cancel — calls onCancel and clears", () => {
    const mgr = new ConfirmManager(() => {});
    const pending = makePending();
    mgr.requestConfirm(pending);
    mgr.resolveConfirm(false);
    expect(pending.onCancel).toHaveBeenCalled();
    expect(pending.onConfirm).not.toHaveBeenCalled();
    expect(mgr.getPendingConfirm()).toBeNull();
  });

  it("no-ops when resolving with no pending", () => {
    const emit = vi.fn();
    const mgr = new ConfirmManager(emit);
    mgr.resolveConfirm(true);
    expect(emit).not.toHaveBeenCalled();
  });

  it("stays open when requireText doesn't match", () => {
    const mgr = new ConfirmManager(() => {});
    const pending = makePending({
      config: { title: "Confirm?", requireText: "DELETE" },
    });
    mgr.requestConfirm(pending);
    mgr.resolveConfirm(true, "wrong");
    expect(mgr.getPendingConfirm()).toBe(pending);
    expect(pending.onConfirm).not.toHaveBeenCalled();
  });

  it("resolves when requireText matches", () => {
    const mgr = new ConfirmManager(() => {});
    const pending = makePending({
      config: { title: "Confirm?", requireText: "DELETE" },
    });
    mgr.requestConfirm(pending);
    mgr.resolveConfirm(true, "DELETE");
    expect(mgr.getPendingConfirm()).toBeNull();
    expect(pending.onConfirm).toHaveBeenCalled();
  });

  it("cancel always works regardless of requireText", () => {
    const mgr = new ConfirmManager(() => {});
    const pending = makePending({
      config: { title: "Confirm?", requireText: "DELETE" },
    });
    mgr.requestConfirm(pending);
    mgr.resolveConfirm(false);
    expect(mgr.getPendingConfirm()).toBeNull();
    expect(pending.onCancel).toHaveBeenCalled();
  });
});
