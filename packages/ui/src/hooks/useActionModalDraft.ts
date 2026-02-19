import { useCallback, useMemo, useRef, useState } from "react";
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

  // Reset draft synchronously when isOpen transitions to true.
  // This must happen during the render phase (not in useEffect) so that
  // auto-focused inputs see the correct default values before
  // useBufferedInput's focus guard locks out external syncs.
  const prevIsOpenRef = useRef(false);
  if (isOpen && !prevIsOpenRef.current) {
    setDraftValues(defaults);
  }
  prevIsOpenRef.current = isOpen;

  const setField = useCallback((key: string, value: unknown) => {
    setDraftValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    draftValues,
    setDraftValues,
    setField,
  };
}
