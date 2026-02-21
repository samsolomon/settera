import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    { key: "general", title: "General" },
    { key: "appearance", title: "Appearance" },
    {
      key: "advanced",
      title: "Advanced",
      pages: [{ key: "advanced.network", title: "Network" }],
    },
  ],
};

function NavConsumer() {
  const { activePage, setActivePage, expandedGroups, toggleGroup } =
    useSetteraNavigation();
  return (
    <div>
      <span data-testid="active">{activePage}</span>
      <span data-testid="expanded">{Array.from(expandedGroups).join(",")}</span>
      <button onClick={() => setActivePage("appearance")}>go-appearance</button>
      <button onClick={() => setActivePage("advanced.network")}>
        go-network
      </button>
      <button onClick={() => toggleGroup("advanced")}>toggle-advanced</button>
    </div>
  );
}

function renderNav() {
  return render(
    <Settera schema={schema} values={{}} onChange={() => {}}>
      <SetteraNavigationProvider>
        <NavConsumer />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

describe("useSetteraNavigation", () => {
  it("returns the first page as active by default", () => {
    renderNav();
    expect(screen.getByTestId("active").textContent).toBe("general");
  });

  it("navigates to a different page", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByText("go-appearance"));
    expect(screen.getByTestId("active").textContent).toBe("appearance");
  });

  it("navigates to a nested page", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByText("go-network"));
    expect(screen.getByTestId("active").textContent).toBe("advanced.network");
  });

  it("toggles expanded groups", async () => {
    const user = userEvent.setup();
    renderNav();
    expect(screen.getByTestId("expanded").textContent).toBe("");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("advanced");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("");
  });

  it("throws in non-production when used outside SetteraNavigationProvider", () => {
    expect(() => render(<NavConsumer />)).toThrow(
      "useSetteraNavigation must be used within a SetteraNavigationProvider.",
    );
  });

  it("resolves initial activePage to child key when first page is flattened", () => {
    const flattenedSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "parent",
          title: "Parent",
          pages: [
            {
              key: "only-child",
              title: "Only Child",
              sections: [
                {
                  key: "s1",
                  title: "S1",
                  settings: [
                    { key: "setting1", title: "Setting 1", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    render(
      <Settera schema={flattenedSchema} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <NavConsumer />
        </SetteraNavigationProvider>
      </Settera>,
    );
    expect(screen.getByTestId("active").textContent).toBe("only-child");
  });
});
