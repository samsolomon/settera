import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildModalDraft,
  type ModalActionFieldSetting,
} from "../components/actionModalUtils.js";

export function useActionModalDraft(
  fields: ModalActionFieldSetting[] | undefined,
  initialValues: Record<string, unknown> | undefined,
  isOpen: boolean,
) {
  const defaults = useMemo(
    () => (fields ? buildModalDraft(fields, initialValues) : {}),
    [fields, initialValues],
  );

  const [draftValues, setDraftValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (isOpen) {
      setDraftValues(defaults);
    }
  }, [defaults, isOpen]);

  const setField = useCallback((key: string, value: unknown) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    draftValues,
    setDraftValues,
    setField,
  };
}
