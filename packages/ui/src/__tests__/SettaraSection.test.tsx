import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { SettaraSection } from "../components/SettaraSection.js";
import type { SettaraSchema } from "@settara/schema";

const schema: SettaraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "behavior",
          title: "Behavior",
          description: "Control how the app behaves.",
          settings: [
            {
              key: "autoSave",
              title: "Auto Save",
              type: "boolean",
              default: false,
            },
            {
              key: "sounds",
              title: "Sounds",
              type: "boolean",
              visibleWhen: { setting: "autoSave", equals: true },
            },
          ],
        },
        {
          key: "withSubs",
          title: "With Subsections",
          settings: [
            {
              key: "topLevel",
              title: "Top Level",
              type: "boolean",
            },
          ],
          subsections: [
            {
              key: "sub1",
              title: "Subsection One",
              description: "First subsection.",
              settings: [
                {
                  key: "subSetting",
                  title: "Sub Setting",
                  type: "text",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function renderSection(
  pageKey: string,
  sectionKey: string,
  values: Record<string, unknown> = {},
) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={() => {}}>
        <SettaraSection pageKey={pageKey} sectionKey={sectionKey} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("SettaraSection", () => {
  it("renders section heading", () => {
    renderSection("general", "behavior");
    expect(screen.getByText("Behavior")).toBeDefined();
  });

  it("renders section description", () => {
    renderSection("general", "behavior");
    expect(screen.getByText("Control how the app behaves.")).toBeDefined();
  });

  it("auto-renders settings", () => {
    renderSection("general", "behavior", { autoSave: false });
    expect(screen.getByText("Auto Save")).toBeDefined();
  });

  it("hides settings when visibility condition not met", () => {
    renderSection("general", "behavior", { autoSave: false });
    expect(screen.queryByText("Sounds")).toBeNull();
  });

  it("uses ARIA section landmark", () => {
    renderSection("general", "behavior");
    const section = screen.getByRole("region", { name: "Behavior" });
    expect(section).toBeDefined();
  });

  it("renders subsections with heading", () => {
    renderSection("general", "withSubs");
    expect(screen.getByText("Subsection One")).toBeDefined();
    expect(screen.getByText("First subsection.")).toBeDefined();
  });

  it("renders subsection settings", () => {
    renderSection("general", "withSubs");
    expect(screen.getByText("Sub Setting")).toBeDefined();
  });
});
