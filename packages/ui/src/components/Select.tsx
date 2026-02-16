import React, { useCallback, useMemo, useRef, useState } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { useSetteraSetting } from "@settera/react";

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
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const isDangerous =
    "dangerous" in definition && Boolean(definition.dangerous);
  const options = definition.type === "select" ? definition.options : [];
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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setIsFocusVisible(false);
      }
    },
    [setIsFocusVisible],
  );

  const pointerDownRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    pointerDownRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocusVisible(!pointerDownRef.current);
    pointerDownRef.current = false;
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocusVisible(false);
  }, []);

  const handleEscapeKeyDown = useCallback((e: KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  const hasError = error !== null;

  return (
    <RadixSelect.Root
      value={selectedValue}
      onValueChange={handleValueChange}
      onOpenChange={handleOpenChange}
    >
      <RadixSelect.Trigger
        data-settera-select-trigger="true"
        onPointerDown={handlePointerDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={definition.title}
        aria-invalid={hasError}
        aria-describedby={hasError ? `settera-error-${settingKey}` : undefined}
        style={{
          fontSize: "var(--settera-input-font-size, 14px)",
          padding: "var(--settera-input-padding, 6px 10px)",
          borderRadius: "var(--settera-input-border-radius, 6px)",
          border: hasError
            ? "1px solid var(--settera-error-color, #dc2626)"
            : "var(--settera-input-border, 1px solid #d1d5db)",
          outline: "none",
          boxShadow: isFocusVisible
            ? "0 0 0 2px var(--settera-focus-ring-color, #93c5fd)"
            : "none",
          minWidth: "var(--settera-select-min-width, 160px)",
          color: isDangerous
            ? "var(--settera-dangerous-color, #dc2626)"
            : "var(--settera-input-color, #111827)",
          backgroundColor: "var(--settera-input-bg, white)",
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
            color: "var(--settera-select-icon-color, #6b7280)",
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
          position="popper"
          sideOffset={6}
          onEscapeKeyDown={handleEscapeKeyDown}
          style={{
            backgroundColor: "var(--settera-input-bg, white)",
            border: "var(--settera-input-border, 1px solid #d1d5db)",
            borderRadius: "var(--settera-input-border-radius, 6px)",
            boxShadow: "0 12px 28px rgba(0, 0, 0, 0.12)",
            overflow: "hidden",
            zIndex: 1000,
          }}
        >
          <RadixSelect.Viewport style={{ padding: "4px" }}>
            {!isRequired && (
              <RadixSelect.Item
                value={emptyOptionValue}
                style={{
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "13px",
                  color: "#6b7280",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <RadixSelect.ItemText>Select…</RadixSelect.ItemText>
              </RadixSelect.Item>
            )}

            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                style={{
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "13px",
                  color: "var(--settera-input-color, #111827)",
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
