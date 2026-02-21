import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Settera } from "../settera.js";
import { SetteraNavigation, useSetteraNavigation } from "../navigation.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "main",
          title: "Main",
          settings: [
            { key: "toggle", title: "Toggle", type: "boolean" },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "extra",
          title: "Extra",
          settings: [
            { key: "debug", title: "Debug", type: "boolean" },
          ],
        },
      ],
    },
  ],
};

const nestedSchema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "parent",
      title: "Parent",
      pages: [
        {
          key: "child",
          title: "Child",
          sections: [
            {
              key: "s",
              title: "S",
              settings: [
                { key: "foo", title: "Foo", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function NavDisplay() {
  const { activePage, setActivePage, pages } = useSetteraNavigation();
  return (
    <div>
      <span data-testid="active-page">{activePage}</span>
      <span data-testid="page-count">{pages.length}</span>
      <button
        data-testid="go-advanced"
        onClick={() => setActivePage("advanced")}
      >
        Go
      </button>
    </div>
  );
}

describe("SetteraNavigation", () => {
  it("returns first page as default activePage", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraNavigation>
          <NavDisplay />
        </SetteraNavigation>
      </Settera>,
    );
    expect(screen.getByTestId("active-page").textContent).toBe("general");
  });

  it("resolves flattened pages (nested page group)", () => {
    render(
      <Settera schema={nestedSchema} values={{}} onChange={() => {}}>
        <SetteraNavigation>
          <NavDisplay />
        </SetteraNavigation>
      </Settera>,
    );
    // resolvePageKey should resolve to the first leaf child
    expect(screen.getByTestId("active-page").textContent).toBe("child");
  });

  it("updates activePage via setActivePage", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraNavigation>
          <NavDisplay />
        </SetteraNavigation>
      </Settera>,
    );
    expect(screen.getByTestId("active-page").textContent).toBe("general");

    act(() => screen.getByTestId("go-advanced").click());
    expect(screen.getByTestId("active-page").textContent).toBe("advanced");
  });

  it("provides pages array from schema", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraNavigation>
          <NavDisplay />
        </SetteraNavigation>
      </Settera>,
    );
    expect(screen.getByTestId("page-count").textContent).toBe("2");
  });

  it("throws outside Settera", () => {
    expect(() => {
      render(
        <SetteraNavigation>
          <NavDisplay />
        </SetteraNavigation>,
      );
    }).toThrow("SetteraNavigation must be used within a Settera component");
  });

  it("throws outside SetteraNavigation", () => {
    expect(() => {
      render(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <NavDisplay />
        </Settera>,
      );
    }).toThrow(
      "useSetteraNavigation must be used within a SetteraNavigation component",
    );
  });

  describe("controlled mode", () => {
    it("uses provided activePage instead of internal state", () => {
      render(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <SetteraNavigation activePage="advanced" onPageChange={() => {}}>
            <NavDisplay />
          </SetteraNavigation>
        </Settera>,
      );
      expect(screen.getByTestId("active-page").textContent).toBe("advanced");
    });

    it("calls onPageChange when setActivePage is invoked", () => {
      const onPageChange = vi.fn();
      render(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <SetteraNavigation activePage="general" onPageChange={onPageChange}>
            <NavDisplay />
          </SetteraNavigation>
        </Settera>,
      );

      act(() => screen.getByTestId("go-advanced").click());

      expect(onPageChange).toHaveBeenCalledWith("advanced");
      // Active page stays "general" because it's controlled externally
      expect(screen.getByTestId("active-page").textContent).toBe("general");
    });

    it("does not update internal state when controlled", () => {
      const onPageChange = vi.fn();
      const { rerender } = render(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <SetteraNavigation activePage="general" onPageChange={onPageChange}>
            <NavDisplay />
          </SetteraNavigation>
        </Settera>,
      );

      act(() => screen.getByTestId("go-advanced").click());
      expect(screen.getByTestId("active-page").textContent).toBe("general");

      // Consumer updates the prop in response to onPageChange
      rerender(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <SetteraNavigation activePage="advanced" onPageChange={onPageChange}>
            <NavDisplay />
          </SetteraNavigation>
        </Settera>,
      );
      expect(screen.getByTestId("active-page").textContent).toBe("advanced");
    });

    it("warns in dev when activePage provided without onPageChange", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <Settera schema={schema} values={{}} onChange={() => {}}>
          <SetteraNavigation activePage="general">
            <NavDisplay />
          </SetteraNavigation>
        </Settera>,
      );
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("`activePage` was provided without `onPageChange`"),
      );
      spy.mockRestore();
    });
  });
});
