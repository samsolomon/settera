import { describe, it, expect, vi } from "vitest";
import { ActionTracker } from "../../stores/action-tracker.js";

describe("ActionTracker", () => {
  it("starts with empty loading state", () => {
    const tracker = new ActionTracker(() => {});
    expect(tracker.getActionLoading()).toEqual({});
  });

  it("does not set loading for sync handler", () => {
    const emit = vi.fn();
    const tracker = new ActionTracker(emit);
    const handler = vi.fn();
    tracker.invokeAction("reset", handler);
    expect(handler).toHaveBeenCalledOnce();
    expect(tracker.getActionLoading()).toEqual({});
    expect(emit).not.toHaveBeenCalled();
  });

  it("sets loading for async handler and clears on resolve", async () => {
    const emit = vi.fn();
    const tracker = new ActionTracker(emit);
    let resolve!: () => void;
    const handler = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );

    tracker.invokeAction("reset", handler);
    expect(tracker.getActionLoading()).toEqual({ reset: true });
    expect(emit).toHaveBeenCalledTimes(1);

    resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(tracker.getActionLoading()).toEqual({});
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it("clears loading on rejection", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const emit = vi.fn();
    const tracker = new ActionTracker(emit);
    const handler = vi.fn().mockRejectedValue(new Error("boom"));

    tracker.invokeAction("reset", handler);
    expect(tracker.getActionLoading()).toEqual({ reset: true });

    await new Promise((r) => setTimeout(r, 0));

    expect(tracker.getActionLoading()).toEqual({});
    expect(consoleSpy).toHaveBeenCalledWith(
      '[settera] Action "reset" failed:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("prevents duplicate invocations while in-flight", async () => {
    const tracker = new ActionTracker(() => {});
    let resolve!: () => void;
    const handler = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );

    tracker.invokeAction("reset", handler);
    tracker.invokeAction("reset", handler);

    expect(handler).toHaveBeenCalledTimes(1);

    resolve();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("does not emit after destroy", async () => {
    const emit = vi.fn();
    const tracker = new ActionTracker(emit);
    let resolve!: () => void;
    const handler = vi.fn(
      () => new Promise<void>((r) => { resolve = r; }),
    );

    tracker.invokeAction("reset", handler);
    expect(emit).toHaveBeenCalledTimes(1); // loading=true emit

    tracker.destroy();
    resolve();
    await new Promise((r) => setTimeout(r, 0));

    // Should not have emitted for the resolve
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("forwards payload to handler", () => {
    const tracker = new ActionTracker(() => {});
    const handler = vi.fn();
    const payload = { foo: "bar" };

    tracker.invokeAction("reset", handler, payload);
    expect(handler).toHaveBeenCalledWith(payload);
  });
});
