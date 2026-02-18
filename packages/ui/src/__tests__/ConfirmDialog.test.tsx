import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Settera,
  useSetteraSetting,
} from "@settera/react";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
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
              key: "experimental",
              title: "Experimental",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                title: "Enable Experimental?",
                message: "This may cause instability.",
              },
            },
            {
              key: "customLabels",
              title: "Custom Labels",
              type: "boolean",
              default: false,
              confirm: {
                message: "Are you sure?",
                confirmLabel: "Yes, do it",
                cancelLabel: "Nope",
              },
            },
            {
              key: "requireTextSetting",
              title: "Require Text",
              type: "boolean",
              default: false,
              confirm: {
                message: "Type DELETE to confirm.",
                requireText: "DELETE",
              },
            },
            {
              key: "noConfirm",
              title: "No Confirm",
              type: "boolean",
              default: false,
            },
          ],
        },
      ],
    },
  ],
};

function ToggleButton({ settingKey }: { settingKey: string }) {
  const { value, setValue } = useSetteraSetting(settingKey);
  return (
    <button
      data-testid={`toggle-${settingKey}`}
      onClick={() => setValue(!value)}
    >
      {String(value)}
    </button>
  );
}

function renderWithDialog(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <Settera schema={schema} values={values} onChange={onChange}>
      <ToggleButton settingKey={settingKey} />
      <ConfirmDialog />
    </Settera>,
  );
}

describe("ConfirmDialog", () => {
  it("does not render when no confirm is pending", () => {
    renderWithDialog("noConfirm", { noConfirm: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders dialog when a confirm setting is toggled", async () => {
    const user = userEvent.setup();
    renderWithDialog("experimental", { experimental: false });
    await user.click(screen.getByTestId("toggle-experimental"));
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("displays title from config", async () => {
    const user = userEvent.setup();
    renderWithDialog("experimental", { experimental: false });
    await user.click(screen.getByTestId("toggle-experimental"));
    expect(screen.getByText("Enable Experimental?")).toBeDefined();
  });

  it("displays message from config", async () => {
    const user = userEvent.setup();
    renderWithDialog("experimental", { experimental: false });
    await user.click(screen.getByTestId("toggle-experimental"));
    expect(screen.getByText("This may cause instability.")).toBeDefined();
  });

  it("uses default title 'Confirm' when not specified", async () => {
    const user = userEvent.setup();
    renderWithDialog("customLabels", { customLabels: false });
    await user.click(screen.getByTestId("toggle-customLabels"));
    // The heading should show "Confirm" as default title
    expect(screen.getByRole("heading", { name: "Confirm" })).toBeDefined();
  });

  it("uses custom confirm/cancel labels", async () => {
    const user = userEvent.setup();
    renderWithDialog("customLabels", { customLabels: false });
    await user.click(screen.getByTestId("toggle-customLabels"));
    expect(screen.getByRole("button", { name: "Yes, do it" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Nope" })).toBeDefined();
  });

  it("applies value on confirm", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog("experimental", { experimental: false }, onChange);
    await user.click(screen.getByTestId("toggle-experimental"));
    // Click confirm button (use role to avoid collision with heading)
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onChange).toHaveBeenCalledWith("experimental", true);
    // Dialog should close
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not apply value on cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog("experimental", { experimental: false }, onChange);
    await user.click(screen.getByTestId("toggle-experimental"));
    // Click cancel button
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog("experimental", { experimental: false }, onChange);
    await user.click(screen.getByTestId("toggle-experimental"));
    expect(screen.getByRole("dialog")).toBeDefined();
    await user.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on backdrop click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog("experimental", { experimental: false }, onChange);
    await user.click(screen.getByTestId("toggle-experimental"));
    const overlay = screen.getByTestId("settera-confirm-overlay");
    await user.click(overlay);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("has aria-modal='true'", async () => {
    const user = userEvent.setup();
    renderWithDialog("experimental", { experimental: false });
    await user.click(screen.getByTestId("toggle-experimental"));
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
  });

  it("renders requireText input when configured", async () => {
    const user = userEvent.setup();
    renderWithDialog("requireTextSetting", { requireTextSetting: false });
    await user.click(screen.getByTestId("toggle-requireTextSetting"));
    expect(screen.getByLabelText("Type DELETE to confirm")).toBeDefined();
  });

  it("disables confirm button until requireText matches", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog(
      "requireTextSetting",
      { requireTextSetting: false },
      onChange,
    );
    await user.click(screen.getByTestId("toggle-requireTextSetting"));

    const confirmBtn = screen.getByRole("button", { name: "Confirm" });
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);

    // Type wrong text
    const input = screen.getByLabelText("Type DELETE to confirm");
    await user.type(input, "DELE");
    expect(confirmBtn.hasAttribute("disabled")).toBe(true);

    // Complete the text
    await user.type(input, "TE");
    expect(confirmBtn.hasAttribute("disabled")).toBe(false);
  });

  it("applies value when requireText matches and confirm is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog(
      "requireTextSetting",
      { requireTextSetting: false },
      onChange,
    );
    await user.click(screen.getByTestId("toggle-requireTextSetting"));

    const input = screen.getByLabelText("Type DELETE to confirm");
    await user.type(input, "DELETE");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(onChange).toHaveBeenCalledWith("requireTextSetting", true);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not apply value immediately — defers until confirm", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithDialog("experimental", { experimental: false }, onChange);
    await user.click(screen.getByTestId("toggle-experimental"));
    // onChange should NOT have been called yet
    expect(onChange).not.toHaveBeenCalled();
    // But dialog should be open
    expect(screen.getByRole("dialog")).toBeDefined();
  });
});
