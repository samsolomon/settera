import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraSettingErrorBoundary } from "../components/SetteraSettingErrorBoundary.js";

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <span data-testid="child">OK</span>;
}

// Suppress React error boundary console noise during tests
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("SetteraSettingErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <SetteraSettingErrorBoundary settingKey="test">
        <ThrowingChild shouldThrow={false} />
      </SetteraSettingErrorBoundary>,
    );
    expect(screen.getByTestId("child").textContent).toBe("OK");
  });

  it("renders nothing by default when child throws", () => {
    const { container } = render(
      <SetteraSettingErrorBoundary settingKey="test">
        <ThrowingChild shouldThrow={true} />
      </SetteraSettingErrorBoundary>,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders ReactNode fallback when child throws", () => {
    render(
      <SetteraSettingErrorBoundary
        settingKey="test"
        fallback={<span data-testid="fallback">Broken</span>}
      >
        <ThrowingChild shouldThrow={true} />
      </SetteraSettingErrorBoundary>,
    );
    expect(screen.getByTestId("fallback").textContent).toBe("Broken");
    expect(screen.queryByTestId("child")).toBeNull();
  });

  it("renders function fallback with error and settingKey", () => {
    render(
      <SetteraSettingErrorBoundary
        settingKey="my-setting"
        fallback={(error, key) => (
          <span data-testid="fallback">
            {key}: {error.message}
          </span>
        )}
      >
        <ThrowingChild shouldThrow={true} />
      </SetteraSettingErrorBoundary>,
    );
    expect(screen.getByTestId("fallback").textContent).toBe(
      "my-setting: Test render error",
    );
  });

  it("calls componentDidCatch with error info in non-production", () => {
    render(
      <SetteraSettingErrorBoundary settingKey="broken-key">
        <ThrowingChild shouldThrow={true} />
      </SetteraSettingErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    const calls = consoleErrorSpy.mock.calls;
    const setteraCall = calls.find(
      (args) =>
        typeof args[0] === "string" &&
        args[0].includes('[Settera] Error rendering setting "broken-key"'),
    );
    expect(setteraCall).toBeDefined();
  });
});
