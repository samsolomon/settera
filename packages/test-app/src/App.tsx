import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  SCHEMA_VERSION,
  getPageByKey,
  evaluateVisibility,
  type PageDefinition,
  type SettingDefinition,
  type CustomSetting,
  type CompoundFieldDefinition,
} from "@settera/schema";
import {
  Settera,
  SetteraNavigation,
  useSettera,
  useSetteraAction,
  useSetteraNavigation,
  useSetteraSetting,
} from "@settera/react";
import {
  SetteraLayout,
  type SetteraCustomPageProps,
  type SetteraCustomSettingProps,
  type SetteraActionPageProps,
} from "@settera/ui";
import { demoSchema } from "./schema.js";

type DemoMode = "schema" | "headless" | "ui";
type ColorMode = "light" | "dark";
type ThemePreset = "default" | "brand" | "dense";

const DEMO_MODE_QUERY_PARAM = "demoMode";

const DEMO_MODE_OPTIONS: Array<{ key: DemoMode; label: string }> = [
  { key: "schema", label: "Schema" },
  { key: "headless", label: "Headless" },
  { key: "ui", label: "Shadcn UI" },
];

const THEME_PRESET_OPTIONS: Array<{ key: ThemePreset; label: string }> = [
  { key: "default", label: "Default" },
  { key: "brand", label: "Brand" },
  { key: "dense", label: "Dense" },
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

function readSystemColorMode(): ColorMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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

const headlessInputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "8px 10px",
  fontSize: "13px",
  width: "100%",
};

const headlessButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  padding: "8px 12px",
  fontSize: "13px",
  cursor: "pointer",
};

const headlessSmallButtonStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#ffffff",
  padding: "4px 8px",
  fontSize: "12px",
  cursor: "pointer",
};

function HeadlessFieldControl({
  field,
  value,
  onChange,
}: {
  field: CompoundFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <input
          type={field.inputType ?? "text"}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={headlessInputStyle}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          placeholder={field.placeholder}
          onChange={(e) => {
            const next = e.target.value;
            onChange(next === "" ? undefined : Number(next));
          }}
          style={{ ...headlessInputStyle, width: "100px" }}
        />
      );
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={headlessInputStyle}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "multiselect":
      return (
        <select
          multiple
          value={Array.isArray(value) ? value.map(String) : []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(
              (o) => o.value,
            );
            onChange(selected);
          }}
          style={{ ...headlessInputStyle, minHeight: "60px" }}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          style={headlessInputStyle}
        />
      );
  }
}

function HeadlessCompoundSetting({ settingKey }: { settingKey: string }) {
  const { value, setValue, definition } = useSetteraSetting(settingKey);
  const [isOpen, setIsOpen] = useState(false);

  if (definition.type !== "compound") return null;

  const obj = (
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? value
      : {}
  ) as Record<string, unknown>;

  const getFieldValue = (field: CompoundFieldDefinition) =>
    obj[field.key] ?? ("default" in field ? field.default : undefined);

  const updateField = (fieldKey: string, fieldValue: unknown) => {
    setValue({ ...obj, [fieldKey]: fieldValue });
  };

  const fieldsUI = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      {definition.fields.map((field) => (
        <label
          key={field.key}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontSize: "13px",
          }}
        >
          <span style={{ fontWeight: 500 }}>{field.title}</span>
          <HeadlessFieldControl
            field={field}
            value={getFieldValue(field)}
            onChange={(v) => updateField(field.key, v)}
          />
        </label>
      ))}
    </div>
  );

  if (definition.displayStyle === "inline") return fieldsUI;

  return (
    <div style={{ width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={headlessButtonStyle}
      >
        {isOpen
          ? "Close"
          : definition.displayStyle === "modal"
            ? "Edit"
            : "Open"}
      </button>
      {isOpen && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        >
          {fieldsUI}
        </div>
      )}
    </div>
  );
}

function HeadlessRepeatableSetting({ settingKey }: { settingKey: string }) {
  const { value, setValue, definition } = useSetteraSetting(settingKey);

  if (definition.type !== "repeatable") return null;

  const items = Array.isArray(value) ? (value as unknown[]) : [];
  const maxItems = definition.validation?.maxItems;
  const canAdd = maxItems === undefined || items.length < maxItems;

  const updateItem = (index: number, newValue: unknown) => {
    const next = [...items];
    next[index] = newValue;
    setValue(next);
  };

  const removeItem = (index: number) => {
    setValue(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const next = [...items];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setValue(next);
  };

  const addItem = () => {
    if (definition.itemType === "text") {
      setValue([...items, ""]);
    } else {
      const defaults: Record<string, unknown> = {};
      definition.itemFields?.forEach((f) => {
        if ("default" in f) defaults[f.key] = f.default;
      });
      setValue([...items, defaults]);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "8px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
          }}
        >
          <div style={{ flex: 1 }}>
            {definition.itemType === "text" ? (
              <input
                type="text"
                value={typeof item === "string" ? item : ""}
                onChange={(e) => updateItem(index, e.target.value)}
                style={headlessInputStyle}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {definition.itemFields?.map((field) => {
                  const obj = (
                    typeof item === "object" &&
                    item !== null &&
                    !Array.isArray(item)
                      ? item
                      : {}
                  ) as Record<string, unknown>;
                  return (
                    <label
                      key={field.key}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{field.title}</span>
                      <HeadlessFieldControl
                        field={field}
                        value={
                          obj[field.key] ??
                          ("default" in field ? field.default : undefined)
                        }
                        onChange={(v) =>
                          updateItem(index, { ...obj, [field.key]: v })
                        }
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => moveItem(index, "up")}
              disabled={index === 0}
              style={headlessSmallButtonStyle}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(index, "down")}
              disabled={index === items.length - 1}
              style={headlessSmallButtonStyle}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeItem(index)}
              style={{ ...headlessSmallButtonStyle, color: "#dc2626" }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={addItem}
          style={{ ...headlessSmallButtonStyle, alignSelf: "flex-start" }}
        >
          + Add item
        </button>
      )}
    </div>
  );
}

function HeadlessActionButton({
  settingKey,
  label,
}: {
  settingKey: string;
  label: string;
}) {
  const { onAction, isLoading, definition } = useSetteraAction(settingKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const isModal =
    definition.type === "action" &&
    definition.actionType === "modal" &&
    definition.modal;

  const openModal = () => {
    if (!isModal || definition.type !== "action" || !definition.modal) return;
    const defaults: Record<string, unknown> = {};
    for (const field of definition.modal.fields) {
      if ("default" in field && field.default !== undefined) {
        defaults[field.key] = field.default;
      }
    }
    setFormValues({ ...defaults, ...definition.modal.initialValues });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    onAction?.(formValues);
    setIsModalOpen(false);
  };

  if (
    isModal &&
    isModalOpen &&
    definition.type === "action" &&
    definition.modal
  ) {
    const modal = definition.modal;
    return (
      <div
        style={{
          width: "100%",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#f8fafc",
          padding: "12px",
        }}
      >
        {modal.title && (
          <div
            style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}
          >
            {modal.title}
          </div>
        )}
        {modal.description && (
          <div
            style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}
          >
            {modal.description}
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          {modal.fields.map((field) => (
            <label
              key={field.key}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "13px",
              }}
            >
              <span style={{ fontWeight: 500 }}>{field.title}</span>
              <HeadlessModalField
                field={field}
                value={formValues[field.key]}
                onChange={(v) =>
                  setFormValues((prev) => ({ ...prev, [field.key]: v }))
                }
              />
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            style={headlessButtonStyle}
          >
            {isLoading ? "Working..." : (modal.submitLabel ?? "Submit")}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            style={headlessButtonStyle}
          >
            {modal.cancelLabel ?? "Cancel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isModal ? openModal : onAction}
      disabled={!onAction || isLoading}
      style={{
        ...headlessButtonStyle,
        cursor: "pointer",
      }}
    >
      {isLoading ? "Working..." : label}
    </button>
  );
}

function HeadlessModalField({
  field,
  value,
  onChange,
}: {
  field: SettingDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (
    field.type === "text" ||
    field.type === "number" ||
    field.type === "boolean" ||
    field.type === "select" ||
    field.type === "multiselect" ||
    field.type === "date"
  ) {
    return (
      <HeadlessFieldControl field={field} value={value} onChange={onChange} />
    );
  }

  if (field.type === "compound") {
    const obj = (
      typeof value === "object" && value !== null && !Array.isArray(value)
        ? value
        : {}
    ) as Record<string, unknown>;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          paddingLeft: "12px",
          borderLeft: "2px solid #e2e8f0",
        }}
      >
        {field.fields.map((subField) => (
          <label
            key={subField.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              fontSize: "13px",
            }}
          >
            <span style={{ fontWeight: 500 }}>{subField.title}</span>
            <HeadlessFieldControl
              field={subField}
              value={
                obj[subField.key] ??
                ("default" in subField ? subField.default : undefined)
              }
              onChange={(v) => onChange({ ...obj, [subField.key]: v })}
            />
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "repeatable") {
    const items = Array.isArray(value) ? (value as unknown[]) : [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: "4px", alignItems: "flex-start" }}
          >
            <div style={{ flex: 1 }}>
              {field.itemType === "text" ? (
                <input
                  type="text"
                  value={typeof item === "string" ? item : ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = e.target.value;
                    onChange(next);
                  }}
                  style={headlessInputStyle}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {field.itemFields?.map((subField) => {
                    const obj = (
                      typeof item === "object" &&
                      item !== null &&
                      !Array.isArray(item)
                        ? item
                        : {}
                    ) as Record<string, unknown>;
                    return (
                      <label
                        key={subField.key}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {subField.title}
                        </span>
                        <HeadlessFieldControl
                          field={subField}
                          value={
                            obj[subField.key] ??
                            ("default" in subField
                              ? subField.default
                              : undefined)
                          }
                          onChange={(v) => {
                            const next = [...items];
                            next[index] = { ...obj, [subField.key]: v };
                            onChange(next);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              style={{ ...headlessSmallButtonStyle, color: "#dc2626" }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            if (field.itemType === "text") {
              onChange([...items, ""]);
            } else {
              const defaults: Record<string, unknown> = {};
              field.itemFields?.forEach((f) => {
                if ("default" in f) defaults[f.key] = f.default;
              });
              onChange([...items, defaults]);
            }
          }}
          style={{ ...headlessSmallButtonStyle, alignSelf: "flex-start" }}
        >
          + Add
        </button>
      </div>
    );
  }

  return null;
}

function HeadlessView({
  customSettings,
}: {
  customSettings?: Record<
    string,
    React.ComponentType<{
      settingKey: string;
      definition: CustomSetting;
    }>
  >;
}) {
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

  const needsExpandedLayout = (type: string) =>
    type === "compound" || type === "repeatable";

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
            const expanded = needsExpandedLayout(setting.type);

            return (
              <div
                key={setting.key}
                style={{
                  display: "flex",
                  flexDirection: expanded ? "column" : "row",
                  alignItems: expanded ? "stretch" : "center",
                  justifyContent: expanded ? undefined : "space-between",
                  gap: expanded ? "10px" : "16px",
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

                  {setting.type === "compound" && (
                    <HeadlessCompoundSetting settingKey={setting.key} />
                  )}

                  {setting.type === "repeatable" && (
                    <HeadlessRepeatableSetting settingKey={setting.key} />
                  )}

                  {setting.type === "action" && (
                    <HeadlessActionButton
                      settingKey={setting.key}
                      label={setting.buttonLabel ?? setting.title}
                    />
                  )}

                  {setting.type === "custom" &&
                    (() => {
                      const Custom = customSettings?.[setting.renderer];
                      return Custom ? (
                        <Custom settingKey={setting.key} definition={setting} />
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                          Missing renderer &ldquo;{setting.renderer}&rdquo;
                        </span>
                      );
                    })()}
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

const demoUsers = [
  {
    initials: "AU",
    name: "Admin User",
    email: "admin@feedback-notes.com",
    role: "Admin",
    created: "Feb 13, 2026",
  },
  {
    initials: "JT",
    name: "Jake Torres",
    email: "jake@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "MC",
    name: "Maria Chen",
    email: "maria@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "RU",
    name: "Review User",
    email: "reviewer@feedback-notes.com",
    role: "Member",
    created: "Feb 13, 2026",
  },
  {
    initials: "SS",
    name: "Sam Solomon",
    email: "sam@feedback-notes.com",
    role: "Admin",
    created: "Feb 13, 2026",
  },
];

function UsersPage({ page }: SetteraCustomPageProps) {
  return (
    <section style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            aria-label="Search users"
            placeholder="Search users..."
            style={{
              fontSize: "14px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              minWidth: "220px",
            }}
          />
          <select
            aria-label="Filter role"
            style={{
              fontSize: "14px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
            }}
            defaultValue="all"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
        </div>

        <button
          type="button"
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            background: "#ffffff",
            padding: "8px 12px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          + Add user
        </button>
      </div>

      <div
        aria-label={`${page.title} table`}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {demoUsers.map((user, index) => (
          <div
            key={user.email}
            style={{
              display: "grid",
              gridTemplateColumns: "64px 1fr 140px 140px 40px",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              borderTop: index === 0 ? "none" : "1px solid #f1f5f9",
            }}
          >
            <span style={{ color: "#6b7280", fontSize: "13px" }}>
              {user.initials}
            </span>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 500 }}>
                {user.name}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {user.email}
              </div>
            </div>
            <span style={{ fontSize: "14px" }}>{user.role}</span>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {user.created}
            </span>
            <span style={{ textAlign: "right", color: "#9ca3af" }}>...</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SignatureCardSetting({
  settingKey,
  definition,
}: SetteraCustomSettingProps) {
  const { value, setValue } = useSetteraSetting(settingKey);

  return (
    <div
      style={{
        border: "1px dashed #d1d5db",
        borderRadius: "10px",
        padding: "10px",
        minWidth: "260px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
        {String(definition.config?.label ?? "Signature")}
      </div>
      <input
        aria-label="Signature card input"
        value={typeof value === "string" ? value : ""}
        placeholder="Kind regards, ..."
        onChange={(e) => setValue(e.target.value)}
        style={{
          width: "100%",
          fontSize: "14px",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid #d1d5db",
        }}
      />
    </div>
  );
}

function AdvancedExportPage({ settingKey, definition, onBack }: SetteraActionPageProps) {
  const { onAction, isLoading } = useSetteraAction(settingKey);
  const [format, setFormat] = useState("json");
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sawLoadingRef = useRef(false);

  // Close after async action completes (same pattern as ActionPageContent)
  useEffect(() => {
    if (isLoading) sawLoadingRef.current = true;
    if (!isSubmitting) return;
    if (sawLoadingRef.current && isLoading) return;
    setIsSubmitting(false);
    sawLoadingRef.current = false;
    onBack();
  }, [isLoading, isSubmitting, onBack]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <p
        style={{
          fontSize: "14px",
          color: "var(--settera-description-color, var(--settera-muted-foreground, #6b7280))",
          margin: 0,
        }}
      >
        This is a custom-rendered action page for &ldquo;{definition.title}&rdquo;.
        It demonstrates the <code>page.renderer</code> pattern.
      </p>
      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px" }}>
        Export Format
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{
            fontSize: "14px",
            padding: "8px 10px",
            borderRadius: "8px",
            border: "var(--settera-input-border, 1px solid var(--settera-input, #d1d5db))",
            maxWidth: "200px",
          }}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xml">XML</option>
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
        <input
          type="checkbox"
          checked={includeAttachments}
          onChange={(e) => setIncludeAttachments(e.target.checked)}
        />
        Include attachments
      </label>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            onAction?.({ format, includeAttachments });
            setIsSubmitting(true);
          }}
          style={{
            border: "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
            borderRadius: "8px",
            background: "var(--settera-button-primary-bg, var(--settera-foreground, #111827))",
            color: "var(--settera-button-primary-color, #ffffff)",
            padding: "8px 16px",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Exporting..." : "Start Export"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          style={{
            border: "var(--settera-button-border, 1px solid var(--settera-input, #d1d5db))",
            borderRadius: "8px",
            background: "var(--settera-button-secondary-bg, var(--settera-card, #ffffff))",
            color: "var(--settera-button-secondary-color, var(--settera-foreground, #374151))",
            padding: "8px 16px",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [mode, setMode] = useState<DemoMode>(readModeFromUrl);
  const [colorMode, setColorMode] = useState<ColorMode>(readSystemColorMode);
  const [themePreset, setThemePreset] = useState<ThemePreset>("default");
  const [values, setValues] = useState<Record<string, unknown>>({});

  const appThemeVars = useMemo<React.CSSProperties>(() => {
    const baseTheme: React.CSSProperties =
      colorMode === "dark"
        ? ({
            colorScheme: "dark",
            background: "#09090b",
            color: "#e4e4e7",
            // Semantic tokens
            "--settera-background": "#09090b",
            "--settera-foreground": "#f4f4f5",
            "--settera-card": "#18181b",
            "--settera-card-foreground": "#e4e4e7",
            "--settera-popover": "#18181b",
            "--settera-popover-foreground": "#f4f4f5",
            "--settera-muted": "#27272a",
            "--settera-muted-foreground": "#a1a1aa",
            "--settera-primary": "#f4f4f5",
            "--settera-primary-foreground": "#18181b",
            "--settera-destructive": "#dc2626",
            "--settera-destructive-foreground": "white",
            "--settera-border": "#27272a",
            "--settera-input": "#3f3f46",
            "--settera-ring": "rgba(161, 161, 170, 0.45)",
            // Overrides beyond semantic tokens
            "--settera-input-bg": "#09090b",
            "--settera-dialog-shadow": "0 20px 60px rgba(0, 0, 0, 0.4)",
            "--settera-sidebar-accent-hover": "#27272a",
          } as React.CSSProperties)
        : ({
            colorScheme: "light",
            background: "#ffffff",
            color: "#111827",
            "--settera-page-bg": "#ffffff",
            "--settera-sidebar-background": "#fafafa",
            "--settera-sidebar-foreground": "#18181b",
            "--settera-sidebar-muted-foreground": "#71717a",
            "--settera-sidebar-border-color": "#e4e4e7",
            "--settera-sidebar-accent": "#f4f4f5",
            "--settera-sidebar-accent-hover": "#f4f4f5",
            "--settera-sidebar-accent-foreground": "#18181b",
          } as React.CSSProperties);

    const presetTheme: React.CSSProperties =
      themePreset === "brand"
        ? colorMode === "dark"
          ? ({
              "--settera-focus-ring-color": "#0ea5e9",
              "--settera-sidebar-accent": "#082f49",
              "--settera-sidebar-accent-hover": "#0c4a6e",
              "--settera-sidebar-accent-foreground": "#e0f2fe",
              "--settera-button-primary-bg": "#0ea5e9",
              "--settera-button-primary-color": "#082f49",
            } as React.CSSProperties)
          : ({
              "--settera-focus-ring-color": "#0284c7",
              "--settera-sidebar-accent": "#e0f2fe",
              "--settera-sidebar-accent-hover": "#bae6fd",
              "--settera-sidebar-accent-foreground": "#0c4a6e",
              "--settera-button-primary-bg": "#0284c7",
              "--settera-button-primary-color": "#f8fafc",
            } as React.CSSProperties)
        : themePreset === "dense"
          ? ({
              "--settera-page-padding": "12px 16px",
              "--settera-page-padding-mobile": "8px 12px",
              "--settera-section-margin-top": "16px",
              "--settera-row-padding-y": "8px 0",
              "--settera-row-padding-x": "0 12px",
              "--settera-input-padding": "4px 8px",
              "--settera-button-padding": "5px 10px",
              "--settera-sidebar-padding": "10px",
              "--settera-sidebar-item-padding": "5px 8px",
              "--settera-sidebar-item-height": "30px",
            } as React.CSSProperties)
          : {};

    return { ...baseTheme, ...presetTheme };
  }, [colorMode, themePreset]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Simulate async save to backend (returns Promise → triggers save indicator)
    return new Promise<void>((resolve) => setTimeout(resolve, 800));
  }, []);

  const handleAction = useCallback((key: string, payload?: unknown) => {
    switch (key) {
      case "actions.export": {
        const config =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
          console.info(
            `[test-app] Data export started (${String(config.format ?? "json")}, include private: ${String(config.includePrivate ?? false)}).`,
          );
        });
      }
      case "actions.clearCache":
        console.info("[test-app] Cache cleared!");
        return;
      case "actions.inviteTeam": {
        const data =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1200)).then(() => {
          console.info(
            `[test-app] Invites queued (${String(data.seatCount ?? 0)} seats, ${Array.isArray(data.emails) ? data.emails.length : 0} email targets).`,
          );
        });
      }
      case "actions.deleteAccount":
        return new Promise<void>((r) => setTimeout(r, 2000)).then(() => {
          console.info("[test-app] Account deleted (just kidding).");
        });
      case "actions.importData": {
        const importConfig =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1000)).then(() => {
          console.info(
            `[test-app] Import started (source: ${String(importConfig.source ?? "csv")}, overwrite: ${String(importConfig.overwrite ?? false)}, dryRun: ${String(importConfig.dryRun ?? true)}).`,
          );
        });
      }
      case "actions.advancedExport": {
        const exportConfig =
          typeof payload === "object" && payload !== null
            ? (payload as Record<string, unknown>)
            : {};
        return new Promise<void>((r) => setTimeout(r, 1500)).then(() => {
          console.info(
            `[test-app] Advanced export (format: ${String(exportConfig.format ?? "json")}, attachments: ${String(exportConfig.includeAttachments ?? false)}).`,
          );
        });
      }
    }
  }, []);

  const handleValidate = useCallback((key: string, value: unknown) => {
    switch (key) {
      case "profile.email":
        return new Promise<string | null>((r) => setTimeout(r, 500)).then(
          () => {
            if (value === "taken@example.com") {
              return "This email is already in use";
            }
            return null;
          },
        );
      default:
        return null;
    }
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setColorMode(event.matches ? "dark" : "light");
    };

    setColorMode(media.matches ? "dark" : "light");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      style={{
        ...appThemeVars,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "12px 24px",
          borderBottom:
            colorMode === "dark" ? "1px solid #27272a" : "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: colorMode === "dark" ? "#09090b" : "#ffffff",
          color: colorMode === "dark" ? "#f4f4f5" : "#111827",
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
              color: colorMode === "dark" ? "#a1a1aa" : "#9ca3af",
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
              border:
                colorMode === "dark"
                  ? "1px solid #3f3f46"
                  : "1px solid #cbd5e1",
              borderRadius: "10px",
              background: colorMode === "dark" ? "#18181b" : "#f8fafc",
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
                    background:
                      isActive && colorMode === "dark"
                        ? "#27272a"
                        : isActive
                          ? "#ffffff"
                          : "transparent",
                    boxShadow: isActive
                      ? colorMode === "dark"
                        ? "none"
                        : "0 1px 2px rgba(15, 23, 42, 0.12)"
                      : "none",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    color:
                      isActive && colorMode === "dark"
                        ? "#fafafa"
                        : isActive
                          ? "#111827"
                          : colorMode === "dark"
                            ? "#a1a1aa"
                            : "#475569",
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
              border:
                colorMode === "dark"
                  ? "1px solid #3f3f46"
                  : "1px solid #d1d5db",
              borderRadius: "8px",
              background: colorMode === "dark" ? "#18181b" : "#ffffff",
              padding: "6px 10px",
              fontSize: "12px",
              color: colorMode === "dark" ? "#e4e4e7" : "#374151",
              cursor: "pointer",
            }}
          >
            Reset values
          </button>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: colorMode === "dark" ? "#a1a1aa" : "#475569",
            }}
          >
            Preset
            <select
              aria-label="Theme preset"
              value={themePreset}
              onChange={(e) => setThemePreset(e.target.value as ThemePreset)}
              style={{
                border:
                  colorMode === "dark"
                    ? "1px solid #3f3f46"
                    : "1px solid #d1d5db",
                borderRadius: "8px",
                background: colorMode === "dark" ? "#18181b" : "#ffffff",
                color: colorMode === "dark" ? "#e4e4e7" : "#374151",
                fontSize: "12px",
                padding: "6px 8px",
              }}
            >
              {THEME_PRESET_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Settera
          schema={demoSchema}
          values={values}
          onChange={handleChange}
          onAction={handleAction}
          onValidate={handleValidate}
        >
          {mode === "ui" && (
            <SetteraLayout
              backToApp={{
                label: "Back to app",
                href: "/",
              }}
              customPages={{ usersPage: UsersPage }}
              customSettings={{ signatureCard: SignatureCardSetting }}
              customActionPages={{ advancedExportPage: AdvancedExportPage }}
            />
          )}
          {mode === "headless" && (
            <SetteraNavigation>
              <HeadlessView
                customSettings={{ signatureCard: SignatureCardSetting }}
              />
            </SetteraNavigation>
          )}
          {mode === "schema" && <SchemaView />}
        </Settera>
      </div>
    </div>
  );
}
