import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import {
  validateSchema,
  flattenSettings,
  getPageByKey,
  buildSettingIndex,
  buildSectionIndex,
} from "@settera/schema";
import type { SetteraSchema } from "@settera/schema";
import { SetteraSchemaContext, SetteraValuesContext } from "./context.js";
import type { SetteraSchemaContextValue } from "./context.js";
import { SetteraValuesStore } from "./stores/index.js";
import type { ValidationMode } from "./stores/index.js";

const IS_DEV =
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV !== "production";

export type { ValidationMode };

export interface SetteraProps {
  /** The settings schema */
  schema: SetteraSchema;
  /** Current values object (flat keys) */
  values: Record<string, unknown>;
  /** Called on every setting change (instant-apply). May return a Promise for async save tracking. */
  onChange: (key: string, value: unknown) => void | Promise<void>;
  /** Handler for action-type settings */
  onAction?: (key: string, payload?: unknown) => void | Promise<void>;
  /** Custom validation callback */
  onValidate?: (key: string, value: unknown) => string | null | Promise<string | null>;
  /** Save policy for sync validation failures. */
  validationMode?: ValidationMode;
  children: React.ReactNode;
}

/**
 * Unified component that provides both schema context and values context.
 * Navigation state is provided separately by SetteraNavigationProvider (UI package).
 */
export function Settera({
  schema,
  values,
  onChange,
  onAction,
  onValidate,
  validationMode = "valid-only",
  children,
}: SetteraProps) {
  // ---- Schema ----

  const schemaErrors = useMemo(() => validateSchema(schema), [schema]);

  if (IS_DEV && schemaErrors.length > 0) {
    const details = schemaErrors
      .slice(0, 5)
      .map((error) => `${error.code} at ${error.path}: ${error.message}`)
      .join("\n");
    throw new Error(
      `[settera] Invalid schema (${schemaErrors.length} error${schemaErrors.length === 1 ? "" : "s"}):\n${details}`,
    );
  }

  // Validate schema on mount/update in production (warn, don't throw)
  useEffect(() => {
    if (IS_DEV || schemaErrors.length === 0) return;
    for (const error of schemaErrors) {
      console.warn(
        `[settera] Schema validation: ${error.code} at ${error.path} — ${error.message}`,
      );
    }
  }, [schemaErrors]);

  // Memoize schema context (stable after mount)
  const schemaContext: SetteraSchemaContextValue = useMemo(
    () => {
      const flat = flattenSettings(schema);
      const settingIdx = buildSettingIndex(flat);
      return {
        schema,
        flatSettings: flat,
        getSettingByKey: (key: string) => settingIdx.get(key)?.definition,
        getPageByKey: (key: string) => getPageByKey(schema, key),
        settingIndex: settingIdx,
        sectionIndex: buildSectionIndex(schema),
      };
    },
    [schema],
  );

  // ---- Values ----

  // Create store once
  const storeRef = useRef<SetteraValuesStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new SetteraValuesStore();
  }
  const store = storeRef.current;

  // Merge schema defaults with provided values so that visibility conditions
  // and value reads resolve correctly even when the consumer hasn't set a value.
  const resolvedValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    for (const { definition } of schemaContext.flatSettings) {
      if ("default" in definition && definition.default !== undefined) {
        defaults[definition.key] = definition.default;
      }
    }
    return { ...defaults, ...values };
  }, [values, schemaContext]);

  // Sync values and pass-through refs during render so children see
  // correct data via getSnapshot() and getOnAction()/getOnValidate()
  // during the same render pass. Does NOT emit — concurrent mode may
  // discard this render without committing.
  store.setValues(resolvedValues);
  store.setOnChange(onChange);
  store.setOnValidate(onValidate);
  store.setOnAction(onAction);
  store.setSchemaLookup(schemaContext.getSettingByKey);
  store.setValidationMode(validationMode);

  // Emit after commit so subscribers (useSyncExternalStore) re-render
  // with the latest values.
  useLayoutEffect(() => {
    store.emitChange();
  }, [store, resolvedValues]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  return (
    <SetteraSchemaContext.Provider value={schemaContext}>
      <SetteraValuesContext.Provider value={store}>
        {children}
      </SetteraValuesContext.Provider>
    </SetteraSchemaContext.Provider>
  );
}
