import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SetteraFieldControl } from "../settera/settera-field-control";
import type { CompoundFieldDefinition } from "@settera/schema";

describe("SetteraFieldControl", () => {
  it("renders text input for type=text", () => {
    const field: CompoundFieldDefinition = {
      key: "name",
      title: "Name",
      type: "text",
    };
    render(
      <SetteraFieldControl
        field={field}
        value="hello"
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Name"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("hello");
  });

  it("renders number input for type=number", () => {
    const field: CompoundFieldDefinition = {
      key: "count",
      title: "Count",
      type: "number",
    };
    render(
      <SetteraFieldControl
        field={field}
        value={42}
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Count"
      />,
    );
    const input = screen.getByRole("spinbutton");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(42);
  });

  it("renders switch for type=boolean", () => {
    const field: CompoundFieldDefinition = {
      key: "enabled",
      title: "Enabled",
      type: "boolean",
    };
    render(
      <SetteraFieldControl
        field={field}
        value={true}
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Enabled"
      />,
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("data-state", "checked");
  });

  it("calls onChange when switch is toggled", () => {
    const onChange = vi.fn();
    const field: CompoundFieldDefinition = {
      key: "enabled",
      title: "Enabled",
      type: "boolean",
    };
    render(
      <SetteraFieldControl
        field={field}
        value={false}
        onChange={onChange}
        fieldId="test-field"
        ariaLabel="Enabled"
      />,
    );
    act(() => {
      screen.getByRole("switch").click();
    });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("renders select for type=select", () => {
    const field: CompoundFieldDefinition = {
      key: "theme",
      title: "Theme",
      type: "select",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    };
    render(
      <SetteraFieldControl
        field={field}
        value="light"
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Theme"
      />,
    );
    // shadcn Select uses a custom trigger, not native select
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
  });

  it("renders checkboxes for type=multiselect", () => {
    const field: CompoundFieldDefinition = {
      key: "features",
      title: "Features",
      type: "multiselect",
      options: [
        { value: "a", label: "Feature A" },
        { value: "b", label: "Feature B" },
        { value: "c", label: "Feature C" },
      ],
    };
    render(
      <SetteraFieldControl
        field={field}
        value={["a", "c"]}
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Features"
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect(checkboxes[0]).toHaveAttribute("data-state", "checked");
    expect(checkboxes[1]).toHaveAttribute("data-state", "unchecked");
    expect(checkboxes[2]).toHaveAttribute("data-state", "checked");
  });

  it("renders date input for type=date", () => {
    const field: CompoundFieldDefinition = {
      key: "dob",
      title: "Date of Birth",
      type: "date",
    };
    render(
      <SetteraFieldControl
        field={field}
        value="2024-03-15"
        onChange={vi.fn()}
        fieldId="test-field"
        ariaLabel="Date of Birth"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("3/15/2024");
  });

  it("returns null for unknown type", () => {
    const field = {
      key: "unknown",
      title: "Unknown",
      type: "unknown-type",
    } as unknown as CompoundFieldDefinition;
    const { container } = render(
      <SetteraFieldControl
        field={field}
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("applies disabled state", () => {
    const field: CompoundFieldDefinition = {
      key: "name",
      title: "Name",
      type: "text",
    };
    render(
      <SetteraFieldControl
        field={field}
        value=""
        onChange={vi.fn()}
        disabled
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
