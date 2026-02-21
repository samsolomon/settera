import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { SetteraSection } from "../components/SetteraSection.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
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
          collapsible: true,
          defaultCollapsed: true,
          visibleWhen: { setting: "showBehaviorSection", equals: true },
          settings: [
            {
              key: "showBehaviorSection",
              title: "Show Behavior Section",
              type: "boolean",
              default: true,
            },
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
              key: "showSubsection",
              title: "Show Subsection",
              type: "boolean",
              default: true,
            },
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
              visibleWhen: { setting: "showSubsection", equals: true },
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
    <Settera schema={schema} values={values} onChange={() => {}}>
      <SetteraNavigationProvider>
        <SetteraSection pageKey={pageKey} sectionKey={sectionKey} />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

describe("SetteraSection", () => {
  it("renders section heading", () => {
    renderSection("general", "behavior", { showBehaviorSection: true });
    expect(screen.getByText("Behavior")).toBeDefined();
  });

  it("renders section description only when expanded", async () => {
    const user = userEvent.setup();
    renderSection("general", "behavior", { showBehaviorSection: true });
    expect(screen.queryByText("Control how the app behaves.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Expand section" }));
    expect(screen.getByText("Control how the app behaves.")).toBeDefined();
  });

  it("auto-renders settings once expanded", async () => {
    const user = userEvent.setup();
    renderSection("general", "behavior", {
      autoSave: false,
      showBehaviorSection: true,
    });
    expect(screen.queryByText("Auto Save")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Expand section" }));
    expect(screen.getByText("Auto Save")).toBeDefined();
  });

  it("hides settings when visibility condition not met", async () => {
    const user = userEvent.setup();
    renderSection("general", "behavior", {
      autoSave: false,
      showBehaviorSection: true,
    });
    await user.click(screen.getByRole("button", { name: "Expand section" }));
    expect(screen.queryByText("Sounds")).toBeNull();
  });

  it("uses ARIA section landmark", () => {
    renderSection("general", "behavior", { showBehaviorSection: true });
    const section = screen.getByRole("region", { name: "Behavior" });
    expect(section).toBeDefined();
  });

  it("renders subsections with heading", () => {
    renderSection("general", "withSubs", { showSubsection: true });
    expect(screen.getByText("Subsection One")).toBeDefined();
    expect(screen.getByText("First subsection.")).toBeDefined();
  });

  it("renders subsection settings", () => {
    renderSection("general", "withSubs", { showSubsection: true });
    expect(screen.getByText("Sub Setting")).toBeDefined();
  });

  it("hides section when section-level visibleWhen is false", () => {
    renderSection("general", "behavior", { showBehaviorSection: false });
    expect(screen.queryByText("Behavior")).toBeNull();
  });

  it("hides subsection when subsection-level visibleWhen is false", () => {
    renderSection("general", "withSubs", { showSubsection: false });
    expect(screen.queryByText("Subsection One")).toBeNull();
    expect(screen.queryByText("Sub Setting")).toBeNull();
  });

  it("starts collapsed when defaultCollapsed is true", () => {
    renderSection("general", "behavior", { showBehaviorSection: true });
    expect(screen.getByText("Expand")).toBeDefined();
    expect(screen.queryByText("Auto Save")).toBeNull();
  });

  it("toggles section collapse state", async () => {
    const user = userEvent.setup();
    renderSection("general", "behavior", { showBehaviorSection: true });

    await user.click(screen.getByRole("button", { name: "Expand section" }));
    expect(screen.getByText("Collapse")).toBeDefined();
    expect(screen.getByText("Auto Save")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Collapse section" }));
    expect(screen.getByText("Expand")).toBeDefined();
    expect(screen.queryByText("Auto Save")).toBeNull();
  });

  it("keeps all settings visible during search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSetteraSearch();
      return <button onClick={() => setQuery("Auto Save")}>search</button>;
    }

    render(
      <Settera
        schema={schema}
        values={{ autoSave: true, showBehaviorSection: true }}
        onChange={() => {}}
      >
        <SetteraNavigationProvider>
          <SearchTrigger />
          <SetteraSection pageKey="general" sectionKey="behavior" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    // Section is collapsed by default
    expect(screen.queryByText("Auto Save")).toBeNull();

    await user.click(screen.getByText("search"));

    // Section auto-expands during search, all settings visible
    expect(screen.getByText("Auto Save")).toBeDefined();
    expect(screen.getByText("Sounds")).toBeDefined();
  });

  it("keeps section visible even when no settings match search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSetteraSearch();
      return <button onClick={() => setQuery("zzz no match")}>search</button>;
    }

    render(
      <Settera
        schema={schema}
        values={{ showBehaviorSection: true }}
        onChange={() => {}}
      >
        <SetteraNavigationProvider>
          <SearchTrigger />
          <SetteraSection pageKey="general" sectionKey="behavior" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    expect(screen.getByText("Behavior")).toBeDefined();

    await user.click(screen.getByText("search"));

    // Section remains visible — content is not filtered
    expect(screen.getByText("Behavior")).toBeDefined();
  });

  it("keeps all subsection settings visible during search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSetteraSearch();
      return <button onClick={() => setQuery("Sub Setting")}>search</button>;
    }

    render(
      <Settera
        schema={schema}
        values={{ showSubsection: true }}
        onChange={() => {}}
      >
        <SetteraNavigationProvider>
          <SearchTrigger />
          <SetteraSection pageKey="general" sectionKey="withSubs" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    // Before search, both top-level and subsection settings visible
    expect(screen.getByText("Top Level")).toBeDefined();
    expect(screen.getByText("Sub Setting")).toBeDefined();

    await user.click(screen.getByText("search"));

    // All settings remain visible during search (content not filtered)
    expect(screen.getByText("Sub Setting")).toBeDefined();
    expect(screen.getByText("Top Level")).toBeDefined();
    expect(screen.getByText("Subsection One")).toBeDefined();
  });

  it("temporarily auto-expands collapsed matching sections during search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSetteraSearch();
      return (
        <>
          <button onClick={() => setQuery("Auto Save")}>search</button>
          <button onClick={() => setQuery("")}>clear</button>
        </>
      );
    }

    render(
      <Settera
        schema={schema}
        values={{ showBehaviorSection: true }}
        onChange={() => {}}
      >
        <SetteraNavigationProvider>
          <SearchTrigger />
          <SetteraSection pageKey="general" sectionKey="behavior" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    expect(screen.queryByText("Auto Save")).toBeNull();
    await user.click(screen.getByText("search"));
    expect(screen.getByText("Auto Save")).toBeDefined();
    await user.click(screen.getByText("clear"));
    expect(screen.queryByText("Auto Save")).toBeNull();
  });
});
