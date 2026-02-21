import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SetteraLabelsContext,
  useSetteraLabels,
  mergeLabels,
} from "../settera/settera-labels";

function LabelReader({ labelKey }: { labelKey: string }) {
  const labels = useSetteraLabels();
  return <span data-testid="label">{labels[labelKey as keyof typeof labels]}</span>;
}

describe("mergeLabels", () => {
  it("returns defaults when no overrides", () => {
    const result = mergeLabels();
    expect(result.saving).toBe("Saving\u2026");
    expect(result.saved).toBe("Saved");
    expect(result.cancel).toBe("Cancel");
  });

  it("returns defaults when undefined", () => {
    const result = mergeLabels(undefined);
    expect(result.saving).toBe("Saving\u2026");
  });

  it("overrides specific labels", () => {
    const result = mergeLabels({ saving: "Guardando\u2026" });
    expect(result.saving).toBe("Guardando\u2026");
    expect(result.saved).toBe("Saved"); // other defaults preserved
  });

  it("overrides multiple labels", () => {
    const result = mergeLabels({
      saving: "Guardando\u2026",
      cancel: "Cancelar",
      back: "Atrás",
    });
    expect(result.saving).toBe("Guardando\u2026");
    expect(result.cancel).toBe("Cancelar");
    expect(result.back).toBe("Atrás");
    expect(result.saved).toBe("Saved");
  });
});

describe("useSetteraLabels", () => {
  it("returns default labels from context", () => {
    render(<LabelReader labelKey="saving" />);
    expect(screen.getByTestId("label").textContent).toBe("Saving\u2026");
  });

  it("returns overridden labels from provider", () => {
    const custom = mergeLabels({ saving: "Guardando\u2026" });
    render(
      <SetteraLabelsContext.Provider value={custom}>
        <LabelReader labelKey="saving" />
      </SetteraLabelsContext.Provider>,
    );
    expect(screen.getByTestId("label").textContent).toBe("Guardando\u2026");
  });
});
