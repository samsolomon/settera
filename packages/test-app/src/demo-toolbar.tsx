import React from "react";

export interface DemoToolbarModeOption {
  key: string;
  label: string;
}

type SelectRestProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "value" | "onChange"
>;

export interface DemoToolbarModeSelectProps extends SelectRestProps {
  mode: string;
  options: DemoToolbarModeOption[];
  onModeChange: (mode: string) => void;
}

export function DemoToolbarModeSelect({
  mode,
  options,
  onModeChange,
  ...rest
}: DemoToolbarModeSelectProps) {
  return (
    <select
      {...rest}
      value={mode}
      onChange={(event) => onModeChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.key} value={option.key}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export interface DemoToolbarVersionProps extends React.HTMLAttributes<HTMLSpanElement> {
  version: string;
  prefix?: string;
  label?: string;
}

export function DemoToolbarVersion({
  version,
  prefix = "Settera v",
  label,
  ...rest
}: DemoToolbarVersionProps) {
  return <span {...rest}>{label ?? `${prefix}${version}`}</span>;
}

type ButtonRestProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

export interface DemoToolbarThemeToggleProps extends Omit<
  ButtonRestProps,
  "onClick"
> {
  isDarkMode: boolean;
  onToggle: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function DemoToolbarThemeToggle({
  isDarkMode,
  onToggle,
  onClick,
  type,
  ...rest
}: DemoToolbarThemeToggleProps) {
  return (
    <button
      {...rest}
      type={type ?? "button"}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        onToggle();
      }}
    >
      {isDarkMode ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4 4 0 0 0 6 6z" />
        </svg>
      )}
    </button>
  );
}
