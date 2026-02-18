import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { useSetteraSearch } from "../hooks/useSetteraSearch.js";
import type { SetteraSchema } from "@settera/schema";

/**
 * Tests for the search matching logic in SetteraNavigationProvider.
 *
 * The basic search tests live in useSetteraSearch.test.tsx.
 * This file covers the more complex walkSchema-based matching:
 *   - Section title matching (includes all settings in that section)
 *   - Subsection title matching
 *   - Nested page propagation (child match → parent in matchingPageKeys)
 *   - Page title matching (includes all settings on the page)
 *   - Cross-level interactions
 */

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
              description: "Save changes automatically",
              type: "boolean",
            },
            { key: "sounds", title: "Sound Effects", type: "boolean" },
          ],
          subsections: [
            {
              key: "advanced-behavior",
              title: "Advanced Behavior",
              settings: [
                {
                  key: "lazyLoad",
                  title: "Lazy Loading",
                  type: "boolean",
                },
              ],
            },
          ],
        },
        {
          key: "profile",
          title: "User Profile",
          settings: [
            { key: "displayName", title: "Display Name", type: "text" },
            { key: "bio", title: "Bio", type: "text" },
          ],
        },
      ],
      pages: [
        {
          key: "general.privacy",
          title: "Privacy",
          sections: [
            {
              key: "data",
              title: "Data Collection",
              settings: [
                {
                  key: "telemetry",
                  title: "Telemetry",
                  type: "boolean",
                },
              ],
            },
          ],
          pages: [
            {
              key: "general.privacy.cookies",
              title: "Cookie Settings",
              sections: [
                {
                  key: "cookie-prefs",
                  title: "Preferences",
                  settings: [
                    {
                      key: "essentialOnly",
                      title: "Essential Only",
                      type: "boolean",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
      sections: [
        {
          key: "theme",
          title: "Theme",
          settings: [
            { key: "darkMode", title: "Dark Mode", type: "boolean" },
          ],
        },
      ],
    },
  ],
};

function SearchConsumer() {
  const { query, setQuery, matchingSettingKeys, matchingPageKeys } =
    useSetteraSearch();
  return (
    <div>
      <span data-testid="query">{query}</span>
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
    </div>
  );
}

function renderSearchProvider() {
  return render(
    <Settera schema={schema} values={{}} onChange={() => {}}>
      <SetteraNavigationProvider>
        <SearchConsumer />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

function setSearch(query: string) {
  const input = screen.getByTestId("search-input");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, query);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function settingKeys() {
  return screen.getByTestId("settingKeys").textContent!;
}

function pageKeys() {
  return screen.getByTestId("pageKeys").textContent!;
}

describe("Navigation search — section title matching", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("includes all settings in a section when section title matches", () => {
    setSearch("Behavior");
    expect(settingKeys()).toContain("autoSave");
    expect(settingKeys()).toContain("sounds");
  });

  it("includes subsection settings when section title matches", () => {
    setSearch("Behavior");
    expect(settingKeys()).toContain("lazyLoad");
  });

  it("includes the page in matchingPageKeys when a section matches", () => {
    setSearch("Behavior");
    expect(pageKeys()).toContain("general");
  });
});

describe("Navigation search — subsection title matching", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("includes subsection settings when subsection title matches", () => {
    setSearch("Advanced Behavior");
    expect(settingKeys()).toContain("lazyLoad");
  });

  it("does not include sibling section settings when only subsection matches", () => {
    setSearch("Advanced Behav");
    const keys = settingKeys();
    expect(keys).toContain("lazyLoad");
    expect(keys).not.toContain("sounds");
  });

  it("includes the page in matchingPageKeys when a subsection matches", () => {
    setSearch("Advanced Behav");
    expect(pageKeys()).toContain("general");
  });
});

describe("Navigation search — page title matching", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("includes all settings on a page when page title matches", () => {
    setSearch("Appearance");
    expect(settingKeys()).toContain("darkMode");
  });

  it("includes the page itself in matchingPageKeys", () => {
    setSearch("Appearance");
    expect(pageKeys()).toContain("appearance");
  });
});

describe("Navigation search — nested page propagation", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("includes parent page when a child page setting matches", () => {
    setSearch("Telemetry");
    expect(settingKeys()).toContain("telemetry");
    expect(pageKeys()).toContain("general.privacy");
    expect(pageKeys()).toContain("general");
  });

  it("includes grandparent when a deeply nested page setting matches", () => {
    setSearch("Essential Only");
    expect(settingKeys()).toContain("essentialOnly");
    expect(pageKeys()).toContain("general.privacy.cookies");
    expect(pageKeys()).toContain("general.privacy");
    expect(pageKeys()).toContain("general");
  });

  it("includes all ancestors when nested page title matches", () => {
    setSearch("Cookie Settings");
    expect(pageKeys()).toContain("general.privacy.cookies");
    expect(pageKeys()).toContain("general.privacy");
    expect(pageKeys()).toContain("general");
  });

  it("does not include sibling pages in propagation", () => {
    setSearch("Essential Only");
    expect(pageKeys()).not.toContain("appearance");
  });
});

describe("Navigation search — setting description matching", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("matches setting by description text", () => {
    setSearch("automatically");
    expect(settingKeys()).toContain("autoSave");
  });

  it("includes the page when a description matches", () => {
    setSearch("automatically");
    expect(pageKeys()).toContain("general");
  });
});

describe("Navigation search — case insensitivity", () => {
  beforeEach(() => {
    renderSearchProvider();
  });

  it("matches section titles case-insensitively", () => {
    setSearch("behavior");
    expect(settingKeys()).toContain("autoSave");
  });

  it("matches page titles case-insensitively", () => {
    setSearch("PRIVACY");
    expect(pageKeys()).toContain("general.privacy");
  });

  it("matches subsection titles case-insensitively", () => {
    setSearch("advanced behavior");
    expect(settingKeys()).toContain("lazyLoad");
  });
});

describe("Navigation search — empty and edge cases", () => {
  it("returns empty sets for empty query", () => {
    renderSearchProvider();
    expect(settingKeys()).toBe("");
    expect(pageKeys()).toBe("");
  });

  it("returns empty sets when nothing matches", () => {
    renderSearchProvider();
    setSearch("xyznonexistent");
    expect(settingKeys()).toBe("");
    expect(pageKeys()).toBe("");
  });

  it("handles schema with no sections gracefully", () => {
    const minimal: SetteraSchema = {
      version: "1.0",
      pages: [{ key: "empty", title: "Empty" }],
    };
    render(
      <Settera schema={minimal} values={{}} onChange={() => {}}>
        <SetteraNavigationProvider>
          <SearchConsumer />
        </SetteraNavigationProvider>
      </Settera>,
    );
    setSearch("Empty");
    expect(pageKeys()).toContain("empty");
    expect(settingKeys()).toBe("");
  });
});
