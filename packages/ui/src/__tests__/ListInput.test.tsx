import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { RepeatableInput } from "../components/ListInput.js";
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
            {
              key: "tags",
              title: "Tags",
              type: "repeatable",
              itemType: "text",
              default: ["one"],
              validation: {
                minItems: 1,
                maxItems: 3,
              },
            },
            {
              key: "addresses",
              title: "Addresses",
              type: "repeatable",
              itemType: "compound",
              itemFields: [
                { key: "street", title: "Street", type: "text" },
                {
                  key: "primary",
                  title: "Primary",
                  type: "boolean",
                  default: false,
                },
              ],
            },
            {
              key: "disabled-tags",
              title: "Disabled Tags",
              type: "repeatable",
              itemType: "text",
              disabled: true,
            },
            {
              key: "disabled-addresses",
              title: "Disabled Addresses",
              type: "repeatable",
              itemType: "compound",
              disabled: true,
              itemFields: [
                { key: "street", title: "Street", type: "text" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function renderRepeatableInput(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={onChange}>
        <RepeatableInput settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("RepeatableInput", () => {
  it("renders existing text items", () => {
    renderRepeatableInput("tags", { tags: ["alpha", "beta"] });
    const items = screen.getAllByLabelText(/List item/i) as HTMLInputElement[];
    expect(items).toHaveLength(2);
    expect(items[0].value).toBe("alpha");
    expect(items[1].value).toBe("beta");
  });

  it("does not commit text item on each keystroke", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha"] }, onChange);

    const input = screen.getByLabelText("List item 1");
    await user.click(input);
    await user.type(input, "x");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits text item on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha"] }, onChange);

    const input = screen.getByLabelText("List item 1");
    await user.click(input);
    await user.type(input, "x");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith("tags", ["alphax"]);
  });

  it("adds new text item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha"] }, onChange);

    await user.click(screen.getByRole("button", { name: "Add item to Tags" }));
    expect(onChange).toHaveBeenCalledWith("tags", ["alpha", ""]);
  });

  it("preserves pending draft when adding item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha"] }, onChange);

    const input = screen.getByLabelText("List item 1");
    await user.click(input);
    await user.type(input, "x");
    await user.click(screen.getByRole("button", { name: "Add item to Tags" }));

    expect(onChange).toHaveBeenCalledWith("tags", ["alphax", ""]);
  });

  it("removes text item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha", "beta"] }, onChange);

    await user.click(screen.getByLabelText("Remove item 1"));
    expect(onChange).toHaveBeenCalledWith("tags", ["beta"]);
  });

  it("reorders text items down", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha", "beta"] }, onChange);

    await user.click(screen.getByLabelText("Move item 1 down"));
    expect(onChange).toHaveBeenCalledWith("tags", ["beta", "alpha"]);
  });

  it("reorders text items using pending draft values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("tags", { tags: ["alpha", "beta"] }, onChange);

    await user.click(screen.getByLabelText("List item 1"));
    await user.type(screen.getByLabelText("List item 1"), "x");
    await user.click(screen.getByLabelText("Move item 1 down"));

    expect(onChange).toHaveBeenCalledWith("tags", ["beta", "alphax"]);
  });

  it("disables add button at maxItems", () => {
    renderRepeatableInput("tags", { tags: ["a", "b", "c"] });
    const add = screen.getByRole("button", {
      name: "Add item to Tags",
    }) as HTMLButtonElement;
    expect(add.disabled).toBe(true);
  });

  it("renders compound item fields", () => {
    renderRepeatableInput("addresses", {
      addresses: [{ street: "123 Main", primary: true }],
    });
    expect(screen.getByLabelText("Street 1")).toBeDefined();
    expect(screen.getByLabelText("Primary 1")).toBeDefined();
  });

  it("adds a compound item with defaults", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput("addresses", { addresses: [] }, onChange);

    await user.click(
      screen.getByRole("button", { name: "Add item to Addresses" }),
    );

    expect(onChange).toHaveBeenCalledWith("addresses", [{ primary: false }]);
  });

  it("preserves pending compound draft when adding item", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput(
      "addresses",
      { addresses: [{ street: "123 Main", primary: false }] },
      onChange,
    );

    await user.click(screen.getByLabelText("Street 1"));
    await user.clear(screen.getByLabelText("Street 1"));
    await user.type(screen.getByLabelText("Street 1"), "456 Park");
    await user.click(
      screen.getByRole("button", { name: "Add item to Addresses" }),
    );

    expect(onChange).toHaveBeenCalledWith("addresses", [
      { street: "456 Park", primary: false },
      { primary: false },
    ]);
  });

  it("updates compound field values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput(
      "addresses",
      { addresses: [{ street: "123 Main", primary: false }] },
      onChange,
    );

    await user.clear(screen.getByLabelText("Street 1"));
    await user.type(screen.getByLabelText("Street 1"), "456 Park");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith("addresses", [
      { street: "456 Park", primary: false },
    ]);
  });

  it("reorders compound items", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderRepeatableInput(
      "addresses",
      {
        addresses: [
          { street: "One", primary: false },
          { street: "Two", primary: true },
        ],
      },
      onChange,
    );

    await user.click(screen.getByLabelText("Move item 1 down"));

    expect(onChange).toHaveBeenCalledWith("addresses", [
      { street: "Two", primary: true },
      { street: "One", primary: false },
    ]);
  });

  describe("disabled", () => {
    it("disables text item inputs and buttons", () => {
      renderRepeatableInput("disabled-tags", {
        "disabled-tags": ["alpha", "beta"],
      });
      const inputs = screen.getAllByLabelText(
        /List item/i,
      ) as HTMLInputElement[];
      for (const input of inputs) {
        expect(input.disabled).toBe(true);
      }
      const removeButtons = screen.getAllByLabelText(
        /Remove item/i,
      ) as HTMLButtonElement[];
      for (const btn of removeButtons) {
        expect(btn.disabled).toBe(true);
      }
    });

    it("disables add item button", () => {
      renderRepeatableInput("disabled-tags", { "disabled-tags": ["alpha"] });
      const addButton = screen.getByRole("button", {
        name: "Add item to Disabled Tags",
      }) as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });

    it("disables compound item fields and buttons", () => {
      renderRepeatableInput("disabled-addresses", {
        "disabled-addresses": [{ street: "123 Main" }],
      });
      const streetInput = screen.getByLabelText("Street 1") as HTMLInputElement;
      expect(streetInput.disabled).toBe(true);
      const removeBtn = screen.getByLabelText(
        "Remove item 1",
      ) as HTMLButtonElement;
      expect(removeBtn.disabled).toBe(true);
    });
  });
});
