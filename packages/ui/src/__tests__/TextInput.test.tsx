import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { TextInput } from "../components/TextInput.js";
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
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={onChange}>
        <TextInput settingKey={settingKey} />
      </SettaraRenderer>
    </SettaraProvider>,
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

  it("calls onChange on every keystroke", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTextInput("name", { name: "" }, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "Hi");
    // Controlled component with no re-render: each keystroke fires with just that char
    expect(onChange).toHaveBeenCalledWith("name", "H");
    expect(onChange).toHaveBeenCalledWith("name", "i");
    expect(onChange).toHaveBeenCalledTimes(2);
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
    expect(input.style.color).toContain("--settara-dangerous-color");
  });

  it("does not apply dangerous styling to normal inputs", () => {
    renderTextInput("name", { name: "hello" });
    const input = screen.getByRole("textbox");
    expect(input.style.color).not.toContain("--settara-dangerous-color");
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
});
