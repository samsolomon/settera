import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { SetteraPage } from "../components/SetteraPage.js";
import { useSetteraNavigation } from "../hooks/useSetteraNavigation.js";
import type { SetteraSchema, SetteraActionPageProps } from "../index.js";

// ---- Test Schema ----

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
              key: "publicCard",
              title: "Public Card",
              type: "compound",
              displayStyle: "page",
              description: "Edit your public card details.",
              fields: [
                { key: "headline", title: "Headline", type: "text" },
                { key: "showLocation", title: "Show Location", type: "boolean", default: true },
              ],
            },
            {
              key: "importData",
              title: "Import Data",
              type: "action",
              buttonLabel: "Import",
              actionType: "page",
              page: {
                title: "Import Data",
                description: "Configure import options.",
                submitLabel: "Start Import",
                cancelLabel: "Go Back",
                fields: [
                  { key: "source", title: "Source", type: "select", options: [
                    { value: "csv", label: "CSV" },
                    { value: "json", label: "JSON" },
                  ], default: "csv" },
                  { key: "overwrite", title: "Overwrite", type: "boolean", default: false },
                ],
              },
            },
            {
              key: "advancedExport",
              title: "Advanced Export",
              type: "action",
              buttonLabel: "Export",
              actionType: "page",
              page: {
                renderer: "exportPage",
                title: "Advanced Export",
              },
            },
            {
              key: "missingRenderer",
              title: "Missing Renderer",
              type: "action",
              buttonLabel: "Open",
              actionType: "page",
              page: {
                renderer: "nonexistent",
              },
            },
          ],
        },
      ],
    },
  ],
};

// ---- Helper to open a subpage ----

function SubpageOpener({ settingKey }: { settingKey: string }) {
  const { openSubpage } = useSetteraNavigation();
  return (
    <button data-testid="open-subpage" onClick={() => openSubpage(settingKey)}>
      Open
    </button>
  );
}

function renderWithSubpage(
  settingKey: string,
  {
    values = {},
    onAction,
    customActionPages,
  }: {
    values?: Record<string, unknown>;
    onAction?: (key: string, payload?: unknown) => void | Promise<void>;
    customActionPages?: Record<string, React.ComponentType<SetteraActionPageProps>>;
  } = {},
) {
  const result = render(
    <Settera schema={schema} values={values} onChange={() => {}} onAction={onAction}>
      <SetteraNavigationProvider>
        <SubpageOpener settingKey={settingKey} />
        <SetteraPage customActionPages={customActionPages} />
      </SetteraNavigationProvider>
    </Settera>,
  );

  // Open the subpage
  act(() => {
    screen.getByTestId("open-subpage").click();
  });

  return result;
}

// ---- SubpageContent routing tests ----

describe("SubpageContent", () => {
  describe("compound page subpage", () => {
    it("renders compound fields with title and description", () => {
      renderWithSubpage("publicCard");

      expect(screen.getByText("Public Card")).toBeDefined();
      expect(screen.getByText("Edit your public card details.")).toBeDefined();
      expect(screen.getByLabelText("Headline")).toBeDefined();
      expect(screen.getByLabelText("Show Location")).toBeDefined();
    });

    it("renders back button with parent page title", () => {
      renderWithSubpage("publicCard");

      const backButton = screen.getByText("General");
      expect(backButton.closest("button")).toBeDefined();
    });

    it("applies default values to compound fields", () => {
      renderWithSubpage("publicCard", { values: {} });

      // "Show Location" has default: true
      const checkbox = screen.getByLabelText("Show Location");
      expect(checkbox).toBeDefined();
    });

    it("renders Save and Cancel buttons", () => {
      renderWithSubpage("publicCard");

      expect(screen.getByText("Save")).toBeDefined();
      expect(screen.getByText("Cancel")).toBeDefined();
    });

    it("does not save until Save is clicked", () => {
      const onChange = vi.fn();
      render(
        <Settera schema={schema} values={{ publicCard: { headline: "Hi" } }} onChange={onChange}>
          <SetteraNavigationProvider>
            <SubpageOpener settingKey="publicCard" />
            <SetteraPage />
          </SetteraNavigationProvider>
        </Settera>,
      );

      act(() => {
        screen.getByTestId("open-subpage").click();
      });

      const input = screen.getByLabelText("Headline") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Hello" } });
      fireEvent.blur(input);

      // onChange should NOT be called yet — changes are buffered in draft
      expect(onChange).not.toHaveBeenCalled();
    });

    it("saves draft and navigates back on Save click", () => {
      const onChange = vi.fn();
      render(
        <Settera schema={schema} values={{ publicCard: { headline: "Hi" } }} onChange={onChange}>
          <SetteraNavigationProvider>
            <SubpageOpener settingKey="publicCard" />
            <SetteraPage />
          </SetteraNavigationProvider>
        </Settera>,
      );

      act(() => {
        screen.getByTestId("open-subpage").click();
      });

      const input = screen.getByLabelText("Headline") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Hello" } });
      fireEvent.blur(input);

      act(() => {
        screen.getByText("Save").click();
      });

      expect(onChange).toHaveBeenCalledWith("publicCard", expect.objectContaining({
        headline: "Hello",
      }));

      // Should navigate back — Save button should be gone
      expect(screen.getByText("General")).toBeDefined();
      expect(screen.queryByText("Save")).toBeNull();
    });

    it("discards changes and navigates back on Cancel click", () => {
      const onChange = vi.fn();
      render(
        <Settera schema={schema} values={{ publicCard: { headline: "Hi" } }} onChange={onChange}>
          <SetteraNavigationProvider>
            <SubpageOpener settingKey="publicCard" />
            <SetteraPage />
          </SetteraNavigationProvider>
        </Settera>,
      );

      act(() => {
        screen.getByTestId("open-subpage").click();
      });

      const input = screen.getByLabelText("Headline") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Hello" } });
      fireEvent.blur(input);

      act(() => {
        screen.getByText("Cancel").click();
      });

      // onChange should NOT have been called
      expect(onChange).not.toHaveBeenCalled();

      // Should navigate back
      expect(screen.getByText("General")).toBeDefined();
    });
  });

  describe("action page subpage with fields", () => {
    it("renders form fields with title and description", () => {
      renderWithSubpage("importData");

      expect(screen.getByText("Import Data")).toBeDefined();
      expect(screen.getByText("Configure import options.")).toBeDefined();
      expect(screen.getByText("Source")).toBeDefined();
      expect(screen.getByText("Overwrite")).toBeDefined();
    });

    it("renders custom submit and cancel labels", () => {
      renderWithSubpage("importData");

      expect(screen.getByText("Start Import")).toBeDefined();
      expect(screen.getByText("Go Back")).toBeDefined();
    });

    it("calls onAction with draft values on submit", async () => {
      vi.useFakeTimers();
      const handler = vi.fn(() => Promise.resolve());

      renderWithSubpage("importData", { onAction: handler });

      act(() => {
        screen.getByText("Start Import").click();
      });

      expect(handler).toHaveBeenCalledWith("importData", expect.objectContaining({
        source: "csv",
        overwrite: false,
      }));

      vi.useRealTimers();
    });

    it("navigates back on cancel", () => {
      renderWithSubpage("importData");

      // Subpage content is showing
      expect(screen.getByText("Import Data")).toBeDefined();

      act(() => {
        screen.getByText("Go Back").click();
      });

      // Should be back to main page
      expect(screen.getByText("General")).toBeDefined();
      expect(screen.queryByText("Configure import options.")).toBeNull();
    });

    it("closes page after async submit completes", async () => {
      vi.useFakeTimers();
      let resolve: () => void;
      const handler = vi.fn(
        () => new Promise<void>((r) => { resolve = r; }),
      );

      renderWithSubpage("importData", { onAction: handler });

      act(() => {
        screen.getByText("Start Import").click();
      });

      // Should show loading state
      expect(screen.getByText("Loading…")).toBeDefined();

      // Resolve the action
      await act(async () => {
        resolve!();
      });

      // Should navigate back to the page
      expect(screen.getByText("General")).toBeDefined();
      expect(screen.queryByText("Configure import options.")).toBeNull();

      vi.useRealTimers();
    });

    it("disables buttons while loading", () => {
      vi.useFakeTimers();
      const handler = vi.fn(() => new Promise<void>(() => {}));

      renderWithSubpage("importData", { onAction: handler });

      act(() => {
        screen.getByText("Start Import").click();
      });

      // Both buttons should be disabled during loading
      const loadingBtn = screen.getByText("Loading…");
      expect(loadingBtn.closest("button")?.disabled).toBe(true);

      const cancelBtn = screen.getByText("Go Back");
      expect(cancelBtn.closest("button")?.disabled).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("action page subpage with custom renderer", () => {
    it("renders custom action page component", () => {
      const CustomExport: React.FC<SetteraActionPageProps> = ({ definition }) => (
        <div data-testid="custom-export">Custom: {definition.title}</div>
      );

      renderWithSubpage("advancedExport", {
        customActionPages: { exportPage: CustomExport },
      });

      expect(screen.getByTestId("custom-export").textContent).toBe(
        "Custom: Advanced Export",
      );
    });

    it("passes onBack to custom renderer", async () => {
      const user = userEvent.setup();
      const CustomExport: React.FC<SetteraActionPageProps> = ({ onBack }) => (
        <button data-testid="custom-back" onClick={onBack}>Go back</button>
      );

      renderWithSubpage("advancedExport", {
        customActionPages: { exportPage: CustomExport },
      });

      await user.click(screen.getByTestId("custom-back"));

      // Should navigate back
      expect(screen.getByText("General")).toBeDefined();
      expect(screen.queryByTestId("custom-export")).toBeNull();
    });

    it("shows fallback when custom renderer is missing", () => {
      renderWithSubpage("missingRenderer");

      expect(screen.getByText(/Missing custom action page renderer/)).toBeDefined();
      expect(screen.getByText(/nonexistent/)).toBeDefined();
    });
  });
});
