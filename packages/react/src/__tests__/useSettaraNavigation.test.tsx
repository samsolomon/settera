import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider } from "../provider.js";
import { useSettaraNavigation } from "../hooks/useSettaraNavigation.js";
import type { SettaraSchema } from "@settara/schema";

const schema: SettaraSchema = {
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
    useSettaraNavigation();
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

describe("useSettaraNavigation", () => {
  it("returns the first page as active by default", () => {
    render(
      <SettaraProvider schema={schema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    expect(screen.getByTestId("active").textContent).toBe("general");
  });

  it("navigates to a different page", async () => {
    const user = userEvent.setup();
    render(
      <SettaraProvider schema={schema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    await user.click(screen.getByText("go-appearance"));
    expect(screen.getByTestId("active").textContent).toBe("appearance");
  });

  it("navigates to a nested page", async () => {
    const user = userEvent.setup();
    render(
      <SettaraProvider schema={schema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    await user.click(screen.getByText("go-network"));
    expect(screen.getByTestId("active").textContent).toBe("advanced.network");
  });

  it("toggles expanded groups", async () => {
    const user = userEvent.setup();
    render(
      <SettaraProvider schema={schema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    expect(screen.getByTestId("expanded").textContent).toBe("");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("advanced");
    await user.click(screen.getByText("toggle-advanced"));
    expect(screen.getByTestId("expanded").textContent).toBe("");
  });

  it("throws when used outside SettaraProvider", () => {
    expect(() => {
      render(<NavConsumer />);
    }).toThrow("useSettaraNavigation must be used within a SettaraProvider");
  });
});
