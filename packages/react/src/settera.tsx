import React, {
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
} from "@settera/schema";
import type { SetteraSchema } from "@settera/schema";
import {
  SetteraSchemaContext,
  SetteraValuesContext,
} from "./context.js";
import type { SetteraSchemaContextValue } from "./context.js";
import { SetteraValuesStore } from "./store.js";

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
  values,
  onChange,
  onAction,
  onValidate,
  children,
}: SetteraProps) {
  // ---- Schema ----

  useEffect(() => {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      for (const error of errors) {
        console.warn(
          `[settera] Schema validation: ${error.code} at ${error.path} — ${error.message}`,
        );
      }
    }
  }, [schema]);

  const schemaContext: SetteraSchemaContextValue = useMemo(
    () => ({
      schema,
      flatSettings: flattenSettings(schema),
      getSettingByKey: (key: string) => getSettingByKey(schema, key),
      getPageByKey: (key: string) => getPageByKey(schema, key),
      dependencies: resolveDependencies(schema),
    }),
    [schema],
  );

  // ---- Values Store ----

  const storeRef = useRef<SetteraValuesStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new SetteraValuesStore();
  }
  const store = storeRef.current;

  const resolvedValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    for (const { definition } of schemaContext.flatSettings) {
      if ("default" in definition && definition.default !== undefined) {
        defaults[definition.key] = definition.default;
      }
    }
    return { ...defaults, ...values };
  }, [values, schemaContext]);

  store.setValues(resolvedValues);
  store.setOnChange(onChange);
  store.setOnValidate(onValidate);
  store.setOnAction(onAction);

  useLayoutEffect(() => {
    store.emitChange();
  }, [store, resolvedValues]);

  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  // ---- Render ----

  return (
    <SetteraSchemaContext.Provider value={schemaContext}>
      <SetteraValuesContext.Provider value={store}>
        {children}
      </SetteraValuesContext.Provider>
    </SetteraSchemaContext.Provider>
  );
}
