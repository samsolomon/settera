import React from "react";
import type { SetteraSchema } from "@settera/schema";
import { SetteraProvider } from "./provider.js";
import { SetteraRenderer } from "./renderer.js";

export interface SetteraProps {
  /** The settings schema */
  schema: SetteraSchema;
  /** Current values object (flat keys) */
  values: Record<string, unknown>;
  /** Called on every setting change (instant-apply). May return a Promise for async save tracking. */
  onChange: (key: string, value: unknown) => void | Promise<void>;
  /** Handlers for action-type settings */
  onAction?: Record<string, (payload?: unknown) => void | Promise<void>>;
  /** Custom validation callbacks */
  onValidate?: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  >;
  children: React.ReactNode;
}

/**
 * Unified component that provides both schema context and values context
 * in a single wrapper. Equivalent to nesting SetteraProvider + SetteraRenderer.
 *
 * Navigation state is provided separately by SetteraNavigationProvider (UI package).
 */
export function Settera({
  schema,
  children,
  ...rendererProps
}: SetteraProps) {
  return (
    <SetteraProvider schema={schema}>
      <SetteraRenderer {...rendererProps}>{children}</SetteraRenderer>
    </SetteraProvider>
  );
}
