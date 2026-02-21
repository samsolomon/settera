import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import { SetteraPage } from "../components/SetteraPage.js";
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
    <Settera schema={schema} values={values} onChange={() => {}}>
      <SetteraNavigationProvider>
        <SetteraPage pageKey={pageKey} />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

describe("SetteraPage", () => {
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

  it("keeps all sections visible during search", async () => {
    const user = userEvent.setup();

    function SearchTrigger() {
      const { setQuery } = useSetteraSearch();
      return <button onClick={() => setQuery("Auto Save")}>search</button>;
    }

    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <SearchTrigger />
          <SetteraPage pageKey="general" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    // Before search, both sections visible
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();

    await user.click(screen.getByText("search"));

    // After search, all sections remain visible (content is not filtered)
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();
  });

  it("shows all sections when not searching", () => {
    renderPage("general");
    expect(screen.getByText("Behavior")).toBeDefined();
    expect(screen.getByText("Profile")).toBeDefined();
  });

  it("renders page description when provided", () => {
    const schemaWithDesc: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "about",
          title: "About",
          description: "Learn more at [our site](https://example.com).",
          sections: [],
        },
      ],
    };

    render(
      <Settera schema={schemaWithDesc} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <SetteraPage pageKey="about" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    expect(screen.getByText("About")).toBeDefined();
    const link = screen.getByText("our site");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("https://example.com");
  });

  it("does not render description paragraph when page has no description", () => {
    renderPage("general");
    // The general page in the test schema has no description
    const h1 = screen.getByText("General");
    const nextSibling = h1.nextElementSibling;
    // Next element should be a section, not a <p>
    expect(nextSibling?.tagName).not.toBe("P");
  });

  it("renders custom page content when mode is custom", () => {
    const customSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "users",
          title: "Users",
          mode: "custom",
          renderer: "usersPage",
        },
      ],
    };

    render(
      <Settera schema={customSchema} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <SetteraPage
            pageKey="users"
            customPages={{
              usersPage: ({ page }) => (
                <div data-testid="users-page">Custom: {page.title}</div>
              ),
            }}
          />
        </SetteraNavigationProvider>
      </Settera>,
    );

    expect(screen.getByTestId("users-page").textContent).toContain(
      "Custom: Users",
    );
  });

  it("shows fallback when custom page renderer is missing", () => {
    const customSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "users",
          title: "Users",
          mode: "custom",
          renderer: "usersPage",
        },
      ],
    };

    render(
      <Settera schema={customSchema} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <SetteraPage pageKey="users" />
        </SetteraNavigationProvider>
      </Settera>,
    );

    expect(
      screen.getByTestId("missing-custom-page-users").textContent,
    ).toContain("usersPage");
  });
});
