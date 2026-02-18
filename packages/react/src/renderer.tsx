import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "./context.js";
import { SetteraValuesStore } from "./stores/index.js";

export interface SetteraRendererProps {
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
 * Context bridge that provides SetteraValuesContext to children.
 * In M1, this is a thin wrapper. Auto-layout renderer comes in M2.
 */
export function SetteraRenderer({
  values,
  onChange,
  onAction,
  onValidate,
  children,
}: SetteraRendererProps) {
  const schemaCtx = useContext(SetteraSchemaContext);

  // Create store once
  const storeRef = useRef<SetteraValuesStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = new SetteraValuesStore();
  }
  const store = storeRef.current;

  // Merge schema defaults with provided values so that visibility conditions
  // and value reads resolve correctly even when the consumer hasn't set a value.
  const resolvedValues = useMemo(() => {
    if (!schemaCtx) return values;
    const defaults: Record<string, unknown> = {};
    for (const { definition } of schemaCtx.flatSettings) {
      if ("default" in definition && definition.default !== undefined) {
        defaults[definition.key] = definition.default;
      }
    }
    return { ...defaults, ...values };
  }, [values, schemaCtx]);

  // Sync values and pass-through refs during render so children see
  // correct data via getSnapshot() and getOnAction()/getOnValidate()
  // during the same render pass. Does NOT emit — concurrent mode may
  // discard this render without committing.
  store.setValues(resolvedValues);
  store.setOnChange(onChange);
  store.setOnValidate(onValidate);
  store.setOnAction(onAction);

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
    <SetteraValuesContext.Provider value={store}>
      {children}
    </SetteraValuesContext.Provider>
  );
}
