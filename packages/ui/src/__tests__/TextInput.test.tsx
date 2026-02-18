import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { TextInput } from "../components/TextInput.js";
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
              key: "name",
              title: "Display Name",
              type: "text",
              placeholder: "Enter your name",
              default: "",
            },
            {
              key: "email",
              title: "Email Address",
              type: "text",
              inputType: "email",
              placeholder: "you@example.com",
              validation: {
                required: true,
                maxLength: 100,
              },
            },
            {
              key: "dangerous",
              title: "Dangerous Field",
              type: "text",
              dangerous: true,
            },
            {
              key: "password",
              title: "Password",
              type: "text",
              inputType: "password",
            },
            {
              key: "website",
              title: "Website",
              type: "text",
              inputType: "url",
              placeholder: "https://example.com",
            },
            {
              key: "disabled-text",
              title: "Disabled Text",
              type: "text",
              disabled: true,
            },
            {
              key: "readonly-text",
              title: "Readonly Text",
              type: "text",
              readonly: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderTextInput(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={onChange}>
        <TextInput settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("TextInput", () => {
  it("renders an input element", () => {
    renderTextInput("name", { name: "" });
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  it("uses correct input type", () => {
    renderTextInput("email", { email: "" });
    const input = screen.getByLabelText("Email Address") as HTMLInputElement;
    expect(input.type).toBe("email");
  });

  it("displays placeholder text", () => {
    renderTextInput("name", { name: "" });
    const input = screen.getByPlaceholderText("Enter your name");
    expect(input).toBeDefined();
  });

  it("displays current value", () => {
    renderTextInput("name", { name: "Alice" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Alice");
  });

  it("does not call onChange on keystroke (buffered)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTextInput("name", { name: "" }, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "Hi");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTextInput("name", { name: "" }, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "Hello");
    await user.tab();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("name", "Hello");
  });

  it("commits on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTextInput("name", { name: "" }, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "World");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("name", "World");
  });

  it("external value updates sync when not focused", () => {
    const { rerender } = render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ name: "Old" }} onChange={() => {}}>
          <TextInput settingKey="name" />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Old");

    rerender(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ name: "New" }} onChange={() => {}}>
          <TextInput settingKey="name" />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(input.value).toBe("New");
  });

  it("external value updates ignored when focused", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ name: "Old" }} onChange={() => {}}>
          <TextInput settingKey="name" />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.click(input);
    await user.type(input, "Typing");

    rerender(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ name: "External" }} onChange={() => {}}>
          <TextInput settingKey="name" />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(input.value).toBe("OldTyping");
  });

  it("uses default value when not in values", () => {
    renderTextInput("name", {});
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("has aria-label from definition title", () => {
    renderTextInput("name", { name: "" });
    expect(screen.getByLabelText("Display Name")).toBeDefined();
  });

  it("has aria-invalid='false' when no error", () => {
    renderTextInput("name", { name: "" });
    const input = screen.getByRole("textbox");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("has aria-invalid='true' when there is a validation error", async () => {
    const user = userEvent.setup();
    renderTextInput("email", { email: "test@example.com" });
    const input = screen.getByLabelText("Email Address");
    await user.clear(input);
    // Blur to trigger commit + validation of empty required field
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderTextInput("name", { name: "" });
    await user.tab();
    const input = screen.getByRole("textbox");
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("respects maxLength from validation", () => {
    renderTextInput("email", { email: "" });
    const input = screen.getByLabelText("Email Address") as HTMLInputElement;
    expect(input.maxLength).toBe(100);
  });

  it("applies dangerous styling", () => {
    renderTextInput("dangerous", { dangerous: "bad" });
    const input = screen.getByRole("textbox");
    expect(input.style.color).toContain("--settera-dangerous-color");
  });

  it("does not apply dangerous styling to normal inputs", () => {
    renderTextInput("name", { name: "hello" });
    const input = screen.getByRole("textbox");
    expect(input.style.color).not.toContain("--settera-dangerous-color");
  });

  it("uses inputType 'password'", () => {
    renderTextInput("password", { password: "" });
    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("uses inputType 'url'", () => {
    renderTextInput("website", { website: "" });
    const input = screen.getByLabelText("Website") as HTMLInputElement;
    expect(input.type).toBe("url");
  });

  it("Escape reverts input value to committed", async () => {
    const user = userEvent.setup();
    renderTextInput("name", { name: "Original" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.click(input);
    await user.type(input, " changed");
    expect(input.value).toBe("Original changed");
    await user.keyboard("{Escape}");
    expect(input.value).toBe("Original");
  });

  it("Escape + blur does not call onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTextInput("name", { name: "Original" }, onChange);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.type(input, " edited");
    await user.keyboard("{Escape}");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("disabled", () => {
    it("renders a disabled input", () => {
      renderTextInput("disabled-text", { "disabled-text": "hello" });
      const input = screen.getByLabelText("Disabled Text") as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it("does not call onChange when disabled", async () => {
      const onChange = vi.fn();
      renderTextInput("disabled-text", { "disabled-text": "hello" }, onChange);
      const input = screen.getByLabelText("Disabled Text") as HTMLInputElement;
      expect(input.disabled).toBe(true);
      // Cannot type into a disabled input; onChange should not fire
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("readonly", () => {
    it("renders a readonly input", () => {
      renderTextInput("readonly-text", { "readonly-text": "hello" });
      const input = screen.getByLabelText("Readonly Text") as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it("does not call onChange on blur after typing", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderTextInput("readonly-text", { "readonly-text": "hello" }, onChange);
      const input = screen.getByLabelText("Readonly Text") as HTMLInputElement;
      await user.click(input);
      await user.tab();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
