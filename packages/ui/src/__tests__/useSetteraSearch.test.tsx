import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
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
              description: "Automatically save changes",
              type: "boolean",
            },
            { key: "sounds", title: "Sound Effects", type: "boolean" },
          ],
        },
        {
          key: "profile",
          title: "User Profile",
          settings: [
            { key: "displayName", title: "Display Name", type: "text" },
          ],
        },
      ],
      pages: [
        {
          key: "privacy",
          title: "Privacy",
          sections: [
            {
              key: "data",
              title: "Data Collection",
              settings: [
                { key: "tracking", title: "Tracking", type: "boolean" },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance Settings",
      sections: [
        {
          key: "theme",
          title: "Theme",
          settings: [
            {
              key: "darkMode",
              title: "Dark Mode",
              description: "Toggle dark appearance",
              type: "boolean",
            },
          ],
        },
      ],
    },
  ],
};

function SearchConsumer() {
  const {
    query,
    setQuery,
    matchingSettingKeys,
    matchingPageKeys,
    isSearching,
  } = useSetteraSearch();
  return (
    <div>
      <span data-testid="query">{query}</span>
      <span data-testid="isSearching">{String(isSearching)}</span>
      <span data-testid="settingKeys">
        {Array.from(matchingSettingKeys).sort().join(",")}
      </span>
      <span data-testid="pageKeys">
        {Array.from(matchingPageKeys).sort().join(",")}
      </span>
      <input
        data-testid="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={() => setQuery("")}>clear</button>
    </div>
  );
}

function renderSearch() {
  return render(
    <Settera schema={schema} values={{}} onChange={() => {}}>
      <SetteraNavigationProvider>
        <SearchConsumer />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

describe("useSetteraSearch", () => {
  it("returns empty query and isSearching=false initially", () => {
    renderSearch();
    expect(screen.getByTestId("query").textContent).toBe("");
    expect(screen.getByTestId("isSearching").textContent).toBe("false");
  });

  it("returns empty sets when query is empty", () => {
    renderSearch();
    expect(screen.getByTestId("settingKeys").textContent).toBe("");
    expect(screen.getByTestId("pageKeys").textContent).toBe("");
  });

  it("updates query and isSearching when setQuery is called", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "auto");
    expect(screen.getByTestId("query").textContent).toBe("auto");
    expect(screen.getByTestId("isSearching").textContent).toBe("true");
  });

  it("matches setting by title", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.clear(screen.getByTestId("search-input"));
    await user.type(screen.getByTestId("search-input"), "Auto Save");
    expect(screen.getByTestId("settingKeys").textContent).toContain("autoSave");
  });

  it("matches setting by description", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "dark appearance");
    expect(screen.getByTestId("settingKeys").textContent).toContain("darkMode");
  });

  it("matches case-insensitively", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "AUTO SAVE");
    expect(screen.getByTestId("settingKeys").textContent).toContain("autoSave");
  });

  it("matches partial substring", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "ound");
    expect(screen.getByTestId("settingKeys").textContent).toContain("sounds");
  });

  it("includes all settings when section title matches", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "Behavior");
    const keys = screen.getByTestId("settingKeys").textContent!;
    expect(keys).toContain("autoSave");
    expect(keys).toContain("sounds");
  });

  it("includes all settings on a page when page title matches", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "Appearance");
    const keys = screen.getByTestId("settingKeys").textContent!;
    expect(keys).toContain("darkMode");
    const pageKeys = screen.getByTestId("pageKeys").textContent!;
    expect(pageKeys).toContain("appearance");
  });

  it("populates matchingPageKeys for pages containing matched settings", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "Auto Save");
    const pageKeys = screen.getByTestId("pageKeys").textContent!;
    expect(pageKeys).toContain("general");
  });

  it("clears results when query is cleared", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByTestId("search-input"), "auto");
    expect(screen.getByTestId("isSearching").textContent).toBe("true");
    await user.click(screen.getByText("clear"));
    expect(screen.getByTestId("isSearching").textContent).toBe("false");
    expect(screen.getByTestId("settingKeys").textContent).toBe("");
  });

  it("returns safe defaults when used outside SetteraNavigationProvider", () => {
    render(<SearchConsumer />);
    expect(screen.getByTestId("query").textContent).toBe("");
    expect(screen.getByTestId("isSearching").textContent).toBe("false");
    expect(screen.getByTestId("settingKeys").textContent).toBe("");
    expect(screen.getByTestId("pageKeys").textContent).toBe("");
  });
});
