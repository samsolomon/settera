import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider } from "../provider.js";
import { SettaraRenderer } from "../renderer.js";
import { SettaraValuesContext } from "../context.js";
import type { SettaraSchema } from "@settara/schema";

const schema: SettaraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "main",
          title: "Main",
          settings: [{ key: "toggle", title: "Toggle", type: "boolean" }],
        },
      ],
    },
  ],
};

function ValuesConsumer() {
  const ctx = React.useContext(SettaraValuesContext);
  if (!ctx) return <div>no values context</div>;
  return (
    <div>
      <span data-testid="toggle-value">{String(ctx.values.toggle)}</span>
      <button onClick={() => ctx.setValue("toggle", true)}>set-true</button>
    </div>
  );
}

describe("SettaraRenderer", () => {
  it("provides values context to children", () => {
    render(
      <SettaraProvider schema={schema}>
        <SettaraRenderer values={{ toggle: false }} onChange={() => {}}>
          <ValuesConsumer />
        </SettaraRenderer>
      </SettaraProvider>,
    );
    expect(screen.getByTestId("toggle-value").textContent).toBe("false");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SettaraProvider schema={schema}>
        <SettaraRenderer values={{ toggle: false }} onChange={onChange}>
          <ValuesConsumer />
        </SettaraRenderer>
      </SettaraProvider>,
    );
    await user.click(screen.getByText("set-true"));
    expect(onChange).toHaveBeenCalledWith("toggle", true);
  });

  it("renders children", () => {
    render(
      <SettaraProvider schema={schema}>
        <SettaraRenderer values={{}} onChange={() => {}}>
          <span data-testid="child">content</span>
        </SettaraRenderer>
      </SettaraProvider>,
    );
    expect(screen.getByTestId("child").textContent).toBe("content");
  });

  it("provides onAction and onValidate to context", () => {
    const onAction = { clearCache: vi.fn() };
    const onValidate = {
      apiKey: () => null,
    };

    function ActionConsumer() {
      const ctx = React.useContext(SettaraValuesContext);
      return (
        <div>
          <span data-testid="has-action">
            {ctx?.onAction?.clearCache ? "yes" : "no"}
          </span>
          <span data-testid="has-validate">
            {ctx?.onValidate?.apiKey ? "yes" : "no"}
          </span>
        </div>
      );
    }

    render(
      <SettaraProvider schema={schema}>
        <SettaraRenderer
          values={{}}
          onChange={() => {}}
          onAction={onAction}
          onValidate={onValidate}
        >
          <ActionConsumer />
        </SettaraRenderer>
      </SettaraProvider>,
    );
    expect(screen.getByTestId("has-action").textContent).toBe("yes");
    expect(screen.getByTestId("has-validate").textContent).toBe("yes");
  });
});
