import { useState, useMemo } from "react";
import {
  getPageByKey,
  evaluateVisibility,
  flattenPageItems,
  type PageDefinition,
  type PageItem,
  type SettingDefinition,
  type CustomSetting,
  type CompoundFieldDefinition,
} from "@settera/schema";
import {
  useSettera,
  useSetteraAction,
  useSetteraNavigation,
  useSetteraSetting,
} from "@settera/react";

// --- Helpers ---

function flattenPages(
  items: PageItem[],
  depth = 0,
  acc: Array<{ key: string; title: string; depth: number }> = [],
): Array<{ key: string; title: string; depth: number }> {
  const pages = flattenPageItems(items);
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

// --- Field Controls ---

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
          className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full"
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
          className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-[100px]"
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
          className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full"
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
          className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full min-h-[60px]"
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
          className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full"
        />
      );
  }
}

// --- Compound ---

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
    <div className="flex flex-col gap-2 w-full">
      {definition.fields.map((field) => (
        <label key={field.key} className="flex flex-col gap-1 text-[13px]">
          <span className="font-medium">{field.title}</span>
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
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-[13px] cursor-pointer"
      >
        {isOpen
          ? "Close"
          : definition.displayStyle === "modal"
            ? "Edit"
            : "Open"}
      </button>
      {isOpen && (
        <div className="mt-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
          {fieldsUI}
        </div>
      )}
    </div>
  );
}

// --- Repeatable ---

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
    <div className="flex flex-col gap-2 w-full">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2 border border-slate-200 rounded-lg bg-slate-50"
        >
          <div className="flex-1">
            {definition.itemType === "text" ? (
              <input
                type="text"
                value={typeof item === "string" ? item : ""}
                onChange={(e) => updateItem(index, e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full"
              />
            ) : (
              <div className="flex flex-col gap-1.5">
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
                      className="flex flex-col gap-0.5 text-[13px]"
                    >
                      <span className="font-medium">{field.title}</span>
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
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => moveItem(index, "up")}
              disabled={index === 0}
              className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer disabled:opacity-40"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveItem(index, "down")}
              disabled={index === items.length - 1}
              className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer disabled:opacity-40"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer text-red-600"
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
          className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer self-start"
        >
          + Add item
        </button>
      )}
    </div>
  );
}

// --- Action Button ---

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
      <div className="w-full border border-slate-200 rounded-lg bg-slate-50 p-3">
        {modal.title && (
          <div className="font-semibold text-sm mb-1">{modal.title}</div>
        )}
        {modal.description && (
          <div className="text-xs text-slate-500 mb-3">
            {modal.description}
          </div>
        )}
        <div className="flex flex-col gap-2.5 mb-3">
          {modal.fields.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-[13px]">
              <span className="font-medium">{field.title}</span>
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-[13px] cursor-pointer"
          >
            {isLoading ? "Working..." : (modal.submitLabel ?? "Submit")}
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-[13px] cursor-pointer"
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
      className="border border-gray-300 rounded-lg bg-white px-3 py-2 text-[13px] cursor-pointer disabled:opacity-50"
    >
      {isLoading ? "Working..." : label}
    </button>
  );
}

// --- Modal Field ---

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
      <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-slate-200">
        {field.fields.map((subField) => (
          <label
            key={subField.key}
            className="flex flex-col gap-0.5 text-[13px]"
          >
            <span className="font-medium">{subField.title}</span>
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
      <div className="flex flex-col gap-1">
        {items.map((item, index) => (
          <div key={index} className="flex gap-1 items-start">
            <div className="flex-1">
              {field.itemType === "text" ? (
                <input
                  type="text"
                  value={typeof item === "string" ? item : ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = e.target.value;
                    onChange(next);
                  }}
                  className="border border-slate-300 rounded-lg px-2.5 py-2 text-[13px] w-full"
                />
              ) : (
                <div className="flex flex-col gap-1">
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
                        className="flex flex-col gap-0.5 text-[13px]"
                      >
                        <span className="font-medium">{subField.title}</span>
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
              className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer text-red-600"
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
          className="border border-gray-300 rounded-md bg-white px-2 py-1 text-xs cursor-pointer self-start"
        >
          + Add
        </button>
      </div>
    );
  }

  return null;
}

// --- Main Headless View ---

export function HeadlessView({
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
    () => getPageByKey(schema, activePage) ?? flattenPageItems(schema.pages)[0],
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
    <div className="flex h-full bg-slate-50 font-sans">
      <aside className="w-[260px] border-r border-slate-200 bg-slate-100 p-3 overflow-y-auto">
        {pageItems.map((item) => {
          const isActive = item.key === activePage;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActivePage(item.key)}
              className={`w-full text-left mb-1 border-none rounded-lg px-2.5 py-2 text-sm cursor-pointer text-slate-900 ${
                isActive ? "bg-blue-100" : "bg-transparent hover:bg-slate-200"
              }`}
              style={{ paddingLeft: `${10 + item.depth * 12}px` }}
            >
              {item.title}
            </button>
          );
        })}
      </aside>

      <main className="flex-1 overflow-y-auto p-5">
        <h2 className="m-0 mb-4 text-2xl font-bold">
          {activePageDef?.title ?? "Headless"}
        </h2>

        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          {visibleSettings.map((setting, index) => {
            const fallback = "default" in setting ? setting.default : undefined;
            const current = values[setting.key] ?? fallback;
            const expanded = needsExpandedLayout(setting.type);

            return (
              <div
                key={setting.key}
                className={`flex gap-4 px-4 py-3.5 ${index > 0 ? "border-t border-slate-100" : ""} ${
                  expanded
                    ? "flex-col items-stretch"
                    : "flex-row items-center justify-between"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm">{setting.title}</div>
                  <div className="text-slate-500 text-xs">{setting.key}</div>
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
                      className="border border-slate-300 rounded-lg px-2.5 py-2 min-w-[220px]"
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
                      className="border border-slate-300 rounded-lg px-2.5 py-2 w-[120px]"
                    />
                  )}

                  {setting.type === "date" && (
                    <input
                      type="date"
                      value={typeof current === "string" ? current : ""}
                      onChange={(e) => setValue(setting.key, e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-2"
                    />
                  )}

                  {setting.type === "select" && (
                    <select
                      value={typeof current === "string" ? current : ""}
                      onChange={(e) => setValue(setting.key, e.target.value)}
                      className="border border-slate-300 rounded-lg px-2.5 py-2 min-w-[180px]"
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
                      value={
                        Array.isArray(current) ? current.map(String) : []
                      }
                      onChange={(e) => {
                        const selected = Array.from(
                          e.target.selectedOptions,
                        ).map((option) => option.value);
                        setValue(setting.key, selected);
                      }}
                      className="border border-slate-300 rounded-lg px-2.5 py-2 min-w-[220px] min-h-[84px]"
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
                        <span className="text-slate-400 text-[13px]">
                          Missing renderer "{setting.renderer}"
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
