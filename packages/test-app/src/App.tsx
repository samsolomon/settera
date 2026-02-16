import { useState, useCallback, useMemo, useEffect } from "react";
import {
  SCHEMA_VERSION,
  getPageByKey,
  type PageDefinition,
  type SettingDefinition,
} from "@settera/schema";
import {
  SetteraProvider,
  SetteraRenderer,
  useSettera,
  useSetteraAction,
  useSetteraNavigation,
  evaluateVisibility,
} from "@settera/react";
import { SetteraLayout } from "@settera/ui";
import { demoSchema } from "./schema.js";

type DemoMode = "schema" | "headless" | "ui";

const DEMO_MODE_QUERY_PARAM = "demoMode";

const DEMO_MODE_OPTIONS: Array<{ key: DemoMode; label: string }> = [
  { key: "schema", label: "Schema" },
  { key: "headless", label: "Headless" },
  { key: "ui", label: "Shadcn UI" },
];

function readModeFromUrl(): DemoMode {
  if (typeof window === "undefined") return "ui";
  const mode = new URL(window.location.href).searchParams.get(
    DEMO_MODE_QUERY_PARAM,
  );
  return mode === "schema" || mode === "headless" || mode === "ui"
    ? mode
    : "ui";
}

function flattenPages(
  pages: PageDefinition[],
  depth = 0,
  acc: Array<{ key: string; title: string; depth: number }> = [],
): Array<{ key: string; title: string; depth: number }> {
  for (const page of pages) {
    acc.push({ key: page.key, title: page.title, depth });
    if (page.pages && page.pages.length > 0) {
      flattenPages(page.pages, depth + 1, acc);
    }
  }
  return acc;
}

function collectPageSettings(page?: PageDefinition): SettingDefinition[] {
  if (!page?.sections) return [];

  const settings: SettingDefinition[] = [];
  for (const section of page.sections) {
    if (section.settings) settings.push(...section.settings);
    if (section.subsections) {
      for (const subsection of section.subsections) {
        settings.push(...subsection.settings);
      }
    }
  }
  return settings;
}

function HeadlessActionButton({
  settingKey,
  label,
}: {
  settingKey: string;
  label: string;
}) {
  const { onAction, isLoading } = useSetteraAction(settingKey);

  return (
    <button
      type="button"
      onClick={onAction}
      disabled={!onAction || isLoading}
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#ffffff",
        padding: "8px 12px",
        fontSize: "13px",
        cursor: onAction ? "pointer" : "not-allowed",
      }}
    >
      {isLoading ? "Working..." : label}
    </button>
  );
}

function HeadlessView() {
  const { schema, values, setValue } = useSettera();
  const { activePage, setActivePage } = useSetteraNavigation();

  const pageItems = useMemo(() => flattenPages(schema.pages), [schema.pages]);
  const activePageDef = useMemo(
    () => getPageByKey(schema, activePage) ?? schema.pages[0],
    [schema, activePage],
  );
  const visibleSettings = useMemo(() => {
    return collectPageSettings(activePageDef).filter((setting) =>
      evaluateVisibility(setting.visibleWhen, values),
    );
  }, [activePageDef, values]);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: "#f8fafc",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <aside
        style={{
          width: "260px",
          borderRight: "1px solid #e2e8f0",
          background: "#f1f5f9",
          padding: "12px",
          overflowY: "auto",
        }}
      >
        {pageItems.map((item) => {
          const isActive = item.key === activePage;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              style={{
                width: "100%",
                textAlign: "left",
                marginBottom: "4px",
                border: "none",
                borderRadius: "8px",
                background: isActive ? "#dbeafe" : "transparent",
                padding: "8px 10px",
                fontSize: "14px",
                cursor: "pointer",
                color: "#0f172a",
                paddingLeft: `${10 + item.depth * 12}px`,
              }}
            >
              {item.title}
            </button>
          );
        })}
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "24px" }}>
          {activePageDef?.title ?? "Headless"}
        </h2>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          {visibleSettings.map((setting, index) => {
            const fallback = "default" in setting ? setting.default : undefined;
            const current = values[setting.key] ?? fallback;
            const borderTop = index > 0 ? "1px solid #f1f5f9" : "none";

            return (
              <div
                key={setting.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "14px 16px",
                  borderTop,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>
                    {setting.title}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    {setting.key}
                  </div>
                </div>

                <div>
                  {setting.type === "boolean" && (
                    <input
                      type="checkbox"
                      checked={Boolean(current)}
                      onChange={(e) => setValue(setting.key, e.target.checked)}
                    />
                  )}

                  {setting.type === "text" && (
                    <input
                      type={setting.inputType ?? "text"}
                      value={typeof current === "string" ? current : ""}
                      onChange={(e) => setValue(setting.key, e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "220px",
                      }}
                    />
                  )}

                  {setting.type === "number" && (
                    <input
                      type="number"
                      value={typeof current === "number" ? current : ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        setValue(
                          setting.key,
                          next === "" ? undefined : Number(next),
                        );
                      }}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        width: "120px",
                      }}
                    />
                  )}

                  {setting.type === "date" && (
                    <input
                      type="date"
                      value={typeof current === "string" ? current : ""}
                      onChange={(e) => setValue(setting.key, e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                      }}
                    />
                  )}

                  {setting.type === "select" && (
                    <select
                      value={typeof current === "string" ? current : ""}
                      onChange={(e) => setValue(setting.key, e.target.value)}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "180px",
                      }}
                    >
                      {setting.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {setting.type === "multiselect" && (
                    <select
                      multiple
                      value={Array.isArray(current) ? current.map(String) : []}
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                        ).map((option) => option.value);
                        setValue(setting.key, selected);
                      }}
                      style={{
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "220px",
                        minHeight: "84px",
                      }}
                    >
                      {setting.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {setting.type === "action" && (
                    <HeadlessActionButton
                      settingKey={setting.key}
                      label={setting.buttonLabel ?? setting.title}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function SchemaView() {
  return (
    <main
      style={{
        height: "100%",
        overflow: "auto",
        background: "#f8fafc",
        padding: "20px",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <pre
        style={{
          margin: 0,
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#ffffff",
          padding: "16px",
          fontSize: "12px",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}
      >
        {JSON.stringify(demoSchema, null, 2)}
      </pre>
    </main>
  );
}

export function App() {
  const [mode, setMode] = useState<DemoMode>(readModeFromUrl);
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Simulate async save to backend (returns Promise → triggers save indicator)
    return new Promise<void>((resolve) => setTimeout(resolve, 800));
  }, []);

  const onAction: Record<string, () => void | Promise<void>> = {
    "actions.export": async () => {
      await new Promise((r) => setTimeout(r, 1500));
      alert("Data exported!");
    },
    "actions.clearCache": () => {
      alert("Cache cleared!");
    },
    "actions.deleteAccount": async () => {
      await new Promise((r) => setTimeout(r, 2000));
      alert("Account deleted (just kidding).");
    },
  };

  const onValidate: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  > = {
    "profile.email": async (value) => {
      await new Promise((r) => setTimeout(r, 500));
      if (value === "taken@example.com") {
        return "This email is already in use";
      }
      return null;
    },
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set(DEMO_MODE_QUERY_PARAM, mode);
    window.history.replaceState(window.history.state, "", url);
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => {
      setMode(readModeFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div>
          <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            Settera Demo
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              margin: "2px 0 0",
            }}
          >
            Schema v{SCHEMA_VERSION}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            role="tablist"
            aria-label="Demo layer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              background: "#f8fafc",
              padding: "2px",
            }}
          >
            {DEMO_MODE_OPTIONS.map((option) => {
              const isActive = mode === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(option.key)}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    background: isActive ? "#ffffff" : "transparent",
                    boxShadow: isActive
                      ? "0 1px 2px rgba(15, 23, 42, 0.12)"
                      : "none",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#111827" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setValues({})}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              padding: "6px 10px",
              fontSize: "12px",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Reset values
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SetteraProvider schema={demoSchema}>
          <SetteraRenderer
            values={values}
            onChange={handleChange}
            onAction={onAction}
            onValidate={onValidate}
          >
            {mode === "ui" && (
              <SetteraLayout
                backToApp={{
                  label: "Back to app",
                  href: "/",
                }}
              />
            )}
            {mode === "headless" && <HeadlessView />}
            {mode === "schema" && <SchemaView />}
          </SetteraRenderer>
        </SetteraProvider>
      </div>
    </div>
  );
}
