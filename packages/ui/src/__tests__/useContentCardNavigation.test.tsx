import React, { useRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useContentCardNavigation } from "../hooks/useContentCardNavigation.js";

/**
 * Test harness that renders a mock settings content area with cards.
 * Each card has a `data-setting-key` and `tabIndex={-1}` like the real SettingRow.
 */
function CardHarness({
  cards,
}: {
  cards: Array<{
    key: string;
    controls?: React.ReactNode;
  }>;
}) {
  const mainRef = useRef<HTMLDivElement>(null);
  const { onKeyDown } = useContentCardNavigation({ mainRef });
  return (
    <div ref={mainRef} data-testid="main" onKeyDown={onKeyDown}>
      {cards.map((card) => (
        <div
          key={card.key}
          data-setting-key={card.key}
          tabIndex={-1}
          data-testid={`card-${card.key}`}
        >
          <span>{card.key}</span>
          {card.controls}
        </div>
      ))}
    </div>
  );
}

function renderCards(
  cards: Array<{ key: string; controls?: React.ReactNode }>,
) {
  return render(<CardHarness cards={cards} />);
}

function pressKey(
  element: HTMLElement,
  key: string,
  opts?: { ctrlKey?: boolean; metaKey?: boolean },
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  act(() => {
    element.dispatchEvent(event);
  });
  return event;
}

describe("useContentCardNavigation", () => {
  beforeEach(() => {
    // Reset focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  // ---- Card-level ArrowDown/ArrowUp ----

  it("ArrowDown moves focus to the next card", () => {
    renderCards([{ key: "a" }, { key: "b" }, { key: "c" }]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("card-b"));
  });

  it("ArrowUp moves focus to the previous card", () => {
    renderCards([{ key: "a" }, { key: "b" }, { key: "c" }]);
    const cardB = screen.getByTestId("card-b");
    act(() => cardB.focus());

    pressKey(cardB, "ArrowUp");
    expect(document.activeElement).toBe(screen.getByTestId("card-a"));
  });

  it("ArrowDown at the last card does not wrap", () => {
    renderCards([{ key: "a" }, { key: "b" }]);
    const cardB = screen.getByTestId("card-b");
    act(() => cardB.focus());

    pressKey(cardB, "ArrowDown");
    // Focus should stay on card-b
    expect(document.activeElement).toBe(cardB);
  });

  it("ArrowUp at the first card does not wrap", () => {
    renderCards([{ key: "a" }, { key: "b" }]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "ArrowUp");
    expect(document.activeElement).toBe(cardA);
  });

  it("calls scrollIntoView on the target card", () => {
    renderCards([{ key: "a" }, { key: "b" }]);
    const cardA = screen.getByTestId("card-a");
    const cardB = screen.getByTestId("card-b");
    cardB.scrollIntoView = vi.fn();
    act(() => cardA.focus());

    pressKey(cardA, "ArrowDown");
    expect(cardB.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("ignores ArrowDown/Up when Ctrl is held", () => {
    renderCards([{ key: "a" }, { key: "b" }]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "ArrowDown", { ctrlKey: true });
    expect(document.activeElement).toBe(cardA);
  });

  it("ignores ArrowDown/Up when Meta is held", () => {
    renderCards([{ key: "a" }, { key: "b" }]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "ArrowDown", { metaKey: true });
    expect(document.activeElement).toBe(cardA);
  });

  it("ignores ArrowDown/Up when focus is on a child control, not the card", () => {
    renderCards([
      {
        key: "a",
        controls: <button data-testid="btn-a">Click</button>,
      },
      { key: "b" },
    ]);
    const btnA = screen.getByTestId("btn-a");
    act(() => btnA.focus());

    pressKey(btnA, "ArrowDown");
    // Focus stays on the button since it's not the card itself
    expect(document.activeElement).toBe(btnA);
  });

  it("ignores ArrowDown when activeElement is a text input", () => {
    renderCards([
      {
        key: "a",
        controls: <input type="text" data-testid="text-a" />,
      },
      { key: "b" },
    ]);
    // We need to focus the card, not the input, for the isTextInput check.
    // But actually the code checks isTextInput(activeEl) — if activeElement is a text input
    // it bails. The card-level check also requires isCardItself, which would be false
    // for the input. Both paths exit early for text inputs inside cards.
    const input = screen.getByTestId("text-a");
    act(() => input.focus());

    pressKey(input, "ArrowDown");
    expect(document.activeElement).toBe(input);
  });

  // ---- Home/End ----

  it("Home moves focus to the first card", () => {
    renderCards([{ key: "a" }, { key: "b" }, { key: "c" }]);
    const cardC = screen.getByTestId("card-c");
    act(() => cardC.focus());

    pressKey(cardC, "Home");
    expect(document.activeElement).toBe(screen.getByTestId("card-a"));
  });

  it("End moves focus to the last card", () => {
    renderCards([{ key: "a" }, { key: "b" }, { key: "c" }]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "End");
    expect(document.activeElement).toBe(screen.getByTestId("card-c"));
  });

  it("Home/End ignored when focus is on a child control", () => {
    renderCards([
      {
        key: "a",
        controls: <button data-testid="btn-a">Click</button>,
      },
      { key: "b" },
    ]);
    const btnA = screen.getByTestId("btn-a");
    act(() => btnA.focus());

    pressKey(btnA, "End");
    expect(document.activeElement).toBe(btnA);
  });

  it("Home/End are no-ops when there are no cards", () => {
    renderCards([]);
    const main = screen.getByTestId("main");
    act(() => main.focus());
    // Should not throw
    pressKey(main, "Home");
    pressKey(main, "End");
  });

  // ---- Enter (drill into control) ----

  it("Enter drills into the first interactive control in a card", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <button data-testid="btn-a" tabIndex={0}>
            Click
          </button>
        ),
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(screen.getByTestId("btn-a"));
  });

  it("Enter skips disabled controls", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <button disabled data-testid="disabled-btn">
              Disabled
            </button>
            <button data-testid="enabled-btn" tabIndex={0}>
              Enabled
            </button>
          </>
        ),
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(screen.getByTestId("enabled-btn"));
  });

  it("Enter skips copy-link buttons", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <button data-settera-copy-link="true" data-testid="copy-btn">
              Copy
            </button>
            <button data-testid="real-btn" tabIndex={0}>
              Real
            </button>
          </>
        ),
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(screen.getByTestId("real-btn"));
  });

  it("Enter skips tabIndex=-1 buttons", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <button tabIndex={-1} data-testid="hidden-btn">
              Hidden
            </button>
            <button data-testid="visible-btn" tabIndex={0}>
              Visible
            </button>
          </>
        ),
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(screen.getByTestId("visible-btn"));
  });

  it("Enter is ignored when focus is on a child control", () => {
    renderCards([
      {
        key: "a",
        controls: <button data-testid="btn-a">Click</button>,
      },
    ]);
    const btnA = screen.getByTestId("btn-a");
    act(() => btnA.focus());

    pressKey(btnA, "Enter");
    // Should stay on the button (not re-drill)
    expect(document.activeElement).toBe(btnA);
  });

  it("Enter does nothing when card has no interactive controls", () => {
    renderCards([
      {
        key: "a",
        controls: <span>Static text</span>,
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(cardA);
  });

  // ---- Enter with multiselect checkboxes ----

  it("Enter drills into first checkbox for multiselect cards", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              Option 1
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-2">
              Option 2
            </div>
          </>
        ),
      },
    ]);
    const cardA = screen.getByTestId("card-a");
    act(() => cardA.focus());

    pressKey(cardA, "Enter");
    expect(document.activeElement).toBe(screen.getByTestId("cb-1"));
  });

  // ---- Checkbox navigation (drilled-in) ----

  it("ArrowDown moves between role=checkbox elements inside a card", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              Option 1
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-2">
              Option 2
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-3">
              Option 3
            </div>
          </>
        ),
      },
      { key: "b" },
    ]);
    const cb1 = screen.getByTestId("cb-1");
    act(() => cb1.focus());

    pressKey(cb1, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("cb-2"));

    const cb2 = screen.getByTestId("cb-2");
    pressKey(cb2, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("cb-3"));
  });

  it("ArrowUp moves between role=checkbox elements inside a card", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              Option 1
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-2">
              Option 2
            </div>
          </>
        ),
      },
    ]);
    const cb2 = screen.getByTestId("cb-2");
    act(() => cb2.focus());

    pressKey(cb2, "ArrowUp");
    expect(document.activeElement).toBe(screen.getByTestId("cb-1"));
  });

  it("ArrowDown on last checkbox does not wrap", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              A
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-2">
              B
            </div>
          </>
        ),
      },
    ]);
    const cb2 = screen.getByTestId("cb-2");
    act(() => cb2.focus());

    pressKey(cb2, "ArrowDown");
    expect(document.activeElement).toBe(cb2);
  });

  it("ArrowUp on first checkbox does not wrap", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              A
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-2">
              B
            </div>
          </>
        ),
      },
    ]);
    const cb1 = screen.getByTestId("cb-1");
    act(() => cb1.focus());

    pressKey(cb1, "ArrowUp");
    expect(document.activeElement).toBe(cb1);
  });

  it("navigates between input[type=checkbox] elements", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <input type="checkbox" data-testid="icb-1" />
            <input type="checkbox" data-testid="icb-2" />
          </>
        ),
      },
    ]);
    const icb1 = screen.getByTestId("icb-1");
    act(() => icb1.focus());

    pressKey(icb1, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("icb-2"));
  });

  it("skips hidden checkboxes", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              A
            </div>
            <div role="checkbox" tabIndex={0} hidden data-testid="cb-hidden">
              Hidden
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-3">
              C
            </div>
          </>
        ),
      },
    ]);
    const cb1 = screen.getByTestId("cb-1");
    act(() => cb1.focus());

    pressKey(cb1, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("cb-3"));
  });

  it("skips aria-hidden checkboxes", () => {
    renderCards([
      {
        key: "a",
        controls: (
          <>
            <div role="checkbox" tabIndex={0} data-testid="cb-1">
              A
            </div>
            <div
              role="checkbox"
              tabIndex={0}
              aria-hidden="true"
              data-testid="cb-aria-hidden"
            >
              Hidden
            </div>
            <div role="checkbox" tabIndex={0} data-testid="cb-3">
              C
            </div>
          </>
        ),
      },
    ]);
    const cb1 = screen.getByTestId("cb-1");
    act(() => cb1.focus());

    pressKey(cb1, "ArrowDown");
    expect(document.activeElement).toBe(screen.getByTestId("cb-3"));
  });
});
