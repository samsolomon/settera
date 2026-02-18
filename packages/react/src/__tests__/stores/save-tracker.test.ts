import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SaveTracker } from "../../stores/save-tracker.js";

describe("SaveTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty save status", () => {
    const tracker = new SaveTracker(() => {});
    expect(tracker.getSaveStatus()).toEqual({});
  });

  it("sets status to saving immediately", () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);
    tracker.trackSave("key1", new Promise(() => {}));
    expect(tracker.getSaveStatus().key1).toBe("saving");
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("transitions to saved after promise resolves", async () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    tracker.trackSave("key1", promise);
    resolve();
    // Flush the microtask (promise resolution) without advancing timers
    await Promise.resolve();
    await Promise.resolve();
    expect(tracker.getSaveStatus().key1).toBe("saved");
  });

  it("auto-reverts to idle after 2s", async () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    tracker.trackSave("key1", promise);
    resolve();
    await vi.runAllTimersAsync();
    expect(tracker.getSaveStatus().key1).toBe("idle");
  });

  it("transitions to error on rejection", async () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);
    let reject!: (err: Error) => void;
    const promise = new Promise<void>((_, r) => {
      reject = r;
    });
    tracker.trackSave("key1", promise);
    reject(new Error("network failure"));
    await vi.runAllTimersAsync();
    expect(tracker.getSaveStatus().key1).toBe("error");
  });

  it("logs error to console on rejection", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const tracker = new SaveTracker(() => {});
    let reject!: (err: Error) => void;
    const promise = new Promise<void>((_, r) => {
      reject = r;
    });
    tracker.trackSave("key1", promise);
    reject(new Error("network failure"));
    await vi.runAllTimersAsync();
    expect(errorSpy).toHaveBeenCalledWith(
      '[settera] Save failed for "key1":',
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  it("ignores stale resolutions (race condition safety)", async () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);

    let resolve1!: () => void;
    const p1 = new Promise<void>((r) => {
      resolve1 = r;
    });
    tracker.trackSave("key1", p1);

    let resolve2!: () => void;
    const p2 = new Promise<void>((r) => {
      resolve2 = r;
    });
    tracker.trackSave("key1", p2);

    // Resolve the first (stale) save
    resolve1();
    await vi.runAllTimersAsync();
    // Should still be saving because p2 hasn't resolved
    expect(tracker.getSaveStatus().key1).toBe("saving");

    // Now resolve p2
    resolve2();
    await vi.runAllTimersAsync();
    // Should transition to idle (saved → idle via timer)
    expect(tracker.getSaveStatus().key1).toBe("idle");
  });

  it("does not emit after destroy", async () => {
    const emit = vi.fn();
    const tracker = new SaveTracker(emit);
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    tracker.trackSave("key1", promise);
    emit.mockClear();
    tracker.destroy();
    resolve();
    await vi.runAllTimersAsync();
    expect(emit).not.toHaveBeenCalled();
  });
});
