import { useStoreSelector } from "./useStoreSelector.js";
import { evaluateVisibility } from "@settera/schema";
import type { VisibilityRule } from "@settera/schema";
import type { SetteraValuesStore } from "../stores/index.js";

/** @internal */
export function useVisibility(
  store: SetteraValuesStore,
  visibleWhen: VisibilityRule | VisibilityRule[] | undefined,
): boolean {
  const hasVisibleWhen = visibleWhen !== undefined;
  const allValues = useStoreSelector(
    store,
    (state) => (hasVisibleWhen ? state.values : undefined),
  );
  return hasVisibleWhen
    ? evaluateVisibility(visibleWhen, allValues!)
    : true;
}
