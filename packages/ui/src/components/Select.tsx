import React, { useCallback, useMemo } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { useSetteraSetting, useFocusVisible } from "@settera/react";
import { token } from "@settera/schema";
import { inputBaseStyle, SETTERA_SYSTEM_FONT } from "./SetteraPrimitives.js";

export interface SelectProps {
  settingKey: string;
}

const EMPTY_OPTION_VALUE_BASE = "__settera_empty_option__";

/**
 * A select dropdown for select settings.
 * Runs both sync and async validation on change (not blur),
 * since select commits value immediately on change.
 */
export function Select({ settingKey }: SelectProps) {
  const { value, setValue, error, definition, validate } =
    useSetteraSetting(settingKey);
  const { isFocusVisible, focusVisibleProps } = useFocusVisible();

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const isDisabled = "disabled" in definition && Boolean(definition.disabled);
  const options = useMemo(
    () => (definition.type === "select" ? definition.options : []),
    [definition],
  );
  const isRequired =
    definition.type === "select" && definition.validation?.required;
  const selectedValue = typeof value === "string" ? value : "";

  const emptyOptionValue = useMemo(() => {
    if (!options.some((opt) => opt.value === EMPTY_OPTION_VALUE_BASE)) {
      return EMPTY_OPTION_VALUE_BASE;
    }

    let i = 1;
    while (
      options.some((opt) => opt.value === `${EMPTY_OPTION_VALUE_BASE}_${i}`)
    ) {
      i += 1;
    }
    return `${EMPTY_OPTION_VALUE_BASE}_${i}`;
  }, [options]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      const resolved = newValue === emptyOptionValue ? "" : newValue;
      setValue(resolved);
      // Run full validation on change for select (commits immediately).
      // Pass the new value explicitly to avoid stale-closure reads.
      validate(resolved);
    },
    [setValue, validate, emptyOptionValue],
  );

  const handleEscapeKeyDown = useCallback((e: KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const hasError = error !== null;

  return (
    <RadixSelect.Root
      value={selectedValue}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <RadixSelect.Trigger
        data-slot="select-trigger"
        data-settera-select-trigger="true"
        {...focusVisibleProps}
        aria-label={definition.title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        style={{
          ...inputBaseStyle,
          border: hasError
            ? `1px solid ${token("error-color")}`
            : token("input-border"),
          boxShadow: isFocusVisible
            ? `0 0 0 2px ${token("focus-ring-color")}`
            : "none",
          minWidth: token("select-min-width"),
          color: isDangerous
            ? token("dangerous-color")
            : token("input-color"),
          backgroundColor: token("select-trigger-bg"),
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <RadixSelect.Value placeholder={isRequired ? "" : "Select…"} />
        <RadixSelect.Icon
          style={{
            color: token("select-icon-color"),
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          data-slot="select-content"
          onEscapeKeyDown={handleEscapeKeyDown}
          style={{
            fontFamily: SETTERA_SYSTEM_FONT,
            backgroundColor: token("select-content-bg"),
            border: token("select-content-border"),
            borderRadius: token("select-content-radius"),
            boxShadow: token("select-content-shadow"),
            overflow: "hidden",
            zIndex: token("z-overlay") as unknown as number,
          }}
        >
          {/* Radix manages data-highlighted internally with no per-item callback,
              so inline styles can't target it. Scoped <style> is the pragmatic escape hatch. */}
          <style>{`[data-slot="select-item"][data-highlighted] { background-color: var(--settera-select-item-highlight-bg, var(--settera-muted, #f4f4f5)); outline: none; }`}</style>
          <RadixSelect.Viewport style={{ padding: "4px" }}>
            {!isRequired && (
              <RadixSelect.Item
                data-slot="select-item"
                value={emptyOptionValue}
                style={{
                  borderRadius: token("select-item-radius"),
                  padding: token("select-item-padding"),
                  fontSize: token("select-item-font-size"),
                  color: token("select-item-muted-color"),
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <RadixSelect.ItemText>Select…</RadixSelect.ItemText>
              </RadixSelect.Item>
            )}

            {options.map((opt) => (
              <RadixSelect.Item
                data-slot="select-item"
                key={opt.value}
                value={opt.value}
                style={{
                  borderRadius: token("select-item-radius"),
                  padding: token("select-item-padding"),
                  fontSize: token("select-item-font-size"),
                  color: token("select-item-color"),
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
