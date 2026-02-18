import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraProvider, SetteraRenderer } from "../index.js";
import { useSetteraSection } from "../hooks/useSetteraSection.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "always",
          title: "Always Visible",
          settings: [
            { key: "mode", title: "Mode", type: "boolean", default: false },
          ],
        },
        {
          key: "conditional",
          title: "Conditional",
          visibleWhen: { setting: "mode", equals: true },
          settings: [
            { key: "extra", title: "Extra", type: "text" },
          ],
        },
      ],
    },
  ],
};

function SectionConsumer({
  pageKey,
  sectionKey,
}: {
  pageKey: string;
  sectionKey: string;
}) {
  const { isVisible, definition } = useSetteraSection(pageKey, sectionKey);
  return (
    <div>
      <span data-testid="visible">{String(isVisible)}</span>
      <span data-testid="title">{definition.title}</span>
    </div>
  );
}

function renderSection(
  pageKey: string,
  sectionKey: string,
  values: Record<string, unknown> = {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={() => {}}>
        <SectionConsumer pageKey={pageKey} sectionKey={sectionKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("useSetteraSection", () => {
  it("returns isVisible true when no visibleWhen", () => {
    renderSection("general", "always");
    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("title").textContent).toBe("Always Visible");
  });

  it("returns isVisible false when condition not met", () => {
    renderSection("general", "conditional", { mode: false });
    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  it("returns isVisible true when condition is met", () => {
    renderSection("general", "conditional", { mode: true });
    expect(screen.getByTestId("visible").textContent).toBe("true");
  });

  it("returns the section definition", () => {
    renderSection("general", "conditional");
    expect(screen.getByTestId("title").textContent).toBe("Conditional");
  });

  it("throws for unknown page key", () => {
    expect(() => renderSection("nope", "always")).toThrow(
      'Page "nope" not found in schema.',
    );
  });

  it("throws for unknown section key", () => {
    expect(() => renderSection("general", "nope")).toThrow(
      'Section "nope" not found in page "general".',
    );
  });

  it("throws when used outside SetteraProvider", () => {
    expect(() =>
      render(
        <SectionConsumer pageKey="general" sectionKey="always" />,
      ),
    ).toThrow("useSetteraSection must be used within a SetteraProvider.");
  });

  it("throws when used outside SetteraRenderer", () => {
    expect(() =>
      render(
        <SetteraProvider schema={schema}>
          <SectionConsumer pageKey="general" sectionKey="always" />
        </SetteraProvider>,
      ),
    ).toThrow("useSetteraSection must be used within a SetteraRenderer.");
  });
});
