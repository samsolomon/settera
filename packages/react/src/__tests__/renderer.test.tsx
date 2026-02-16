import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider } from "../provider.js";
import { SetteraRenderer } from "../renderer.js";
import { SetteraValuesContext } from "../context.js";
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
          settings: [{ key: "toggle", title: "Toggle", type: "boolean" }],
        },
      ],
    },
  ],
};

function ValuesConsumer() {
  const ctx = React.useContext(SetteraValuesContext);
  if (!ctx) return <div>no values context</div>;
  return (
    <div>
      <span data-testid="toggle-value">{String(ctx.values.toggle)}</span>
      <button onClick={() => ctx.setValue("toggle", true)}>set-true</button>
    </div>
  );
}

describe("SetteraRenderer", () => {
  it("provides values context to children", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={() => {}}>
          <ValuesConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("toggle-value").textContent).toBe("false");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <ValuesConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    await user.click(screen.getByText("set-true"));
    expect(onChange).toHaveBeenCalledWith("toggle", true);
  });

  it("renders children", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={() => {}}>
          <span data-testid="child">content</span>
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("child").textContent).toBe("content");
  });

  it("provides onAction and onValidate to context", () => {
    const onAction = { clearCache: vi.fn() };
    const onValidate = {
      apiKey: () => null,
    };

    function ActionConsumer() {
      const ctx = React.useContext(SetteraValuesContext);
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
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{}}
          onChange={() => {}}
          onAction={onAction}
          onValidate={onValidate}
        >
          <ActionConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("has-action").textContent).toBe("yes");
    expect(screen.getByTestId("has-validate").textContent).toBe("yes");
  });
});
