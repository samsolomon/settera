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
 * Unified component that provides both schema context and values context.
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

  // Validate schema on mount (warn, don't throw)
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
