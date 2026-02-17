import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "./context.js";
import type {
  SetteraValuesContextValue,
  PendingConfirm,
  SaveStatus,
} from "./context.js";

export interface SetteraRendererProps {
  /** Current values object (flat keys) */
  values: Record<string, unknown>;
  /** Called on every setting change (instant-apply). May return a Promise for async save tracking. */
  onChange: (key: string, value: unknown) => void | Promise<void>;
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

  // ---- Async save tracking ----
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const saveGenerationRef = useRef<Record<string, number>>({});
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const timer of Object.values(saveTimersRef.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const setValue = useCallback(
    (key: string, value: unknown) => {
      const result = onChange(key, value);

      if (result instanceof Promise) {
        const gen = (saveGenerationRef.current[key] ?? 0) + 1;
        saveGenerationRef.current[key] = gen;

        setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));

        result.then(
          () => {
            if (!mountedRef.current) return;
            if (saveGenerationRef.current[key] !== gen) return;
            setSaveStatus((prev) => ({ ...prev, [key]: "saved" }));
            clearTimeout(saveTimersRef.current[key]);
            saveTimersRef.current[key] = setTimeout(() => {
              if (!mountedRef.current) return;
              if (saveGenerationRef.current[key] !== gen) return;
              setSaveStatus((prev) => ({ ...prev, [key]: "idle" }));
            }, 2000);
          },
          () => {
            if (!mountedRef.current) return;
            if (saveGenerationRef.current[key] !== gen) return;
            setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
          },
        );
      }
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
      saveStatus,
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
      saveStatus,
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
