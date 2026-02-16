import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { SetteraSearch } from "../components/SetteraSearch.js";
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
          settings: [{ key: "autoSave", title: "Auto Save", type: "boolean" }],
        },
      ],
    },
  ],
};

function renderSearch() {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={{}} onChange={() => {}}>
        <SetteraSearch />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("SetteraSearch", () => {
  it("renders a search input", () => {
    renderSearch();
    expect(screen.getByRole("searchbox")).toBeDefined();
  });

  it("has a placeholder", () => {
    renderSearch();
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    expect(input.placeholder).toContain("Search");
  });

  it("has an aria-label", () => {
    renderSearch();
    expect(screen.getByLabelText("Search settings")).toBeDefined();
  });

  it("updates value on type", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.type(input, "hello");
    expect(input.value).toBe("hello");
  });

  it("shows clear button when query is non-empty", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByRole("searchbox"), "test");
    expect(screen.getByLabelText("Clear search")).toBeDefined();
  });

  it("does not show clear button when query is empty", () => {
    renderSearch();
    expect(screen.queryByLabelText("Clear search")).toBeNull();
  });

  it("clears query when clear button is clicked", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.type(input, "test");
    await user.click(screen.getByLabelText("Clear search"));
    expect(input.value).toBe("");
  });

  it("clears query on Escape key", async () => {
    const user = userEvent.setup();
    renderSearch();
    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.type(input, "test");
    await user.keyboard("{Escape}");
    expect(input.value).toBe("");
  });
});
