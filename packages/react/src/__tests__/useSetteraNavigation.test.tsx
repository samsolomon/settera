import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider } from "../provider.js";
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

describe("useSetteraNavigation", () => {
  it("returns the first page as active by default", () => {
    render(
      <SetteraProvider schema={schema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("active").textContent).toBe("general");
  });

  it("navigates to a different page", async () => {
    const user = userEvent.setup();
    render(
      <SetteraProvider schema={schema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    await user.click(screen.getByText("go-appearance"));
    expect(screen.getByTestId("active").textContent).toBe("appearance");
  });

  it("navigates to a nested page", async () => {
    const user = userEvent.setup();
    render(
      <SetteraProvider schema={schema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    await user.click(screen.getByText("go-network"));
    expect(screen.getByTestId("active").textContent).toBe("advanced.network");
  });

  it("toggles expanded groups", async () => {
    const user = userEvent.setup();
    render(
      <SetteraProvider schema={schema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("expanded").textContent).toBe("");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("advanced");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("");
  });

  it("throws when used outside SetteraProvider", () => {
    expect(() => {
      render(<NavConsumer />);
    }).toThrow("useSetteraNavigation must be used within a SetteraProvider");
  });
});
