import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SettaraProvider,
  SettaraRenderer,
  useSettaraSearch,
} from "@settara/react";
import { SettaraPage } from "../components/SettaraPage.js";
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
          settings: [
            {
              key: "autoSave",
              title: "Auto Save",
              type: "boolean",
              default: false,
            },
          ],
        },
        {
          key: "profile",
          title: "Profile",
          settings: [
            {
              key: "name",
              title: "Display Name",
              type: "text",
            },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "experimental",
          title: "Experimental",
          settings: [
            {
              key: "debug",
              title: "Debug Mode",
              type: "boolean",
            },
          ],
        },
      ],
    },
  ],
};

function renderPage(pageKey?: string, values: Record<string, unknown> = {}) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={() => {}}>
        <SettaraPage pageKey={pageKey} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("SettaraPage", () => {
  it("renders the page title", () => {
    renderPage("general");
    expect(screen.getByText("General")).toBeDefined();
  });

  it("renders all sections for the page", () => {
    renderPage("general");
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();
  });

  it("defaults to first page (activePage) when no pageKey", () => {
    renderPage();
    // activePage defaults to first page "general"
    expect(screen.getByText("General")).toBeDefined();
    expect(screen.getByText("Auto Save")).toBeDefined();
  });

  it("renders correct page when pageKey override provided", () => {
    renderPage("advanced");
    expect(screen.getByText("Advanced")).toBeDefined();
    expect(screen.getByText("Experimental")).toBeDefined();
    expect(screen.getByText("Debug Mode")).toBeDefined();
  });

  it("renders null for invalid page key", () => {
    renderPage("nonexistent");
    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders settings within sections", () => {
    renderPage("general");
    expect(screen.getByText("Auto Save")).toBeDefined();
    expect(screen.getByText("Display Name")).toBeDefined();
  });

  it("hides sections with no matches during search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSettaraSearch();
      return <button onClick={() => setQuery("Auto Save")}>search</button>;
    }

    render(
      <SettaraProvider schema={schema}>
        <SettaraRenderer values={{}} onChange={() => {}}>
          <SearchTrigger />
          <SettaraPage pageKey="general" />
        </SettaraRenderer>
      </SettaraProvider>,
    );

    // Before search, both sections visible
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();

    await user.click(screen.getByText("search"));

    // After search, only Behavior section should be visible
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.queryByText("Profile")).toBeNull();
  });

  it("shows all sections when not searching", () => {
    renderPage("general");
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();
  });
});
