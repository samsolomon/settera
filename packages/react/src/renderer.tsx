import React, {
  useState,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "./context.js";
import type { SetteraValuesContextValue, PendingConfirm } from "./context.js";

export interface SetteraRendererProps {
  /** Current values object (flat keys) */
  values: Record<string, unknown>;
  /** Called on every setting change (instant-apply) */
  onChange: (key: string, value: unknown) => void;
  /** Optional batch change handler for compound settings */
  onBatchChange?: (changes: Array<{ key: string; value: unknown }>) => void;
  /** Handlers for action-type settings */
  onAction?: Record<string, () => void | Promise<void>>;
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = useCallback((key: string, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: error };
    });
  }, []);

  const setValue = useCallback(
    (key: string, value: unknown) => {
      onChange(key, value);
    },
    [onChange],
  );

  // ---- Confirm dialog state ----
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  );
  const pendingConfirmRef = useRef<PendingConfirm | null>(null);
  pendingConfirmRef.current = pendingConfirm;

  const requestConfirm = useCallback((pending: PendingConfirm) => {
    const prev = pendingConfirmRef.current;
    if (prev) prev.onCancel();
    setPendingConfirm(pending);
  }, []);

  const resolveConfirm = useCallback((confirmed: boolean) => {
    const prev = pendingConfirmRef.current;
    if (!prev) return;
    setPendingConfirm(null);
    if (confirmed) {
      prev.onConfirm();
    } else {
      prev.onCancel();
    }
  }, []);

  const contextValue: SetteraValuesContextValue = useMemo(
    () => ({
      values: resolvedValues,
      setValue,
      errors,
      setError,
      onValidate,
      onAction,
      pendingConfirm,
      requestConfirm,
      resolveConfirm,
    }),
    [
      resolvedValues,
      setValue,
      errors,
      setError,
      onValidate,
      onAction,
      pendingConfirm,
      requestConfirm,
      resolveConfirm,
    ],
  );

  return (
    <SetteraValuesContext.Provider value={contextValue}>
      {children}
    </SetteraValuesContext.Provider>
  );
}
