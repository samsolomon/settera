import { useContext } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useStoreSelector } from "./useStoreSelector.js";
import { evaluateVisibility, type SectionDefinition } from "@settera/schema";

export interface UseSetteraSectionResult {
  /** Whether this section is currently visible */
  isVisible: boolean;
  /** The section definition from the schema */
  definition: SectionDefinition;
}

/**
 * Access section-level metadata and visibility for a given page + section key pair.
 * Must be used within a Settera component.
 */
export function useSetteraSection(
  pageKey: string,
  sectionKey: string,
): UseSetteraSectionResult {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSetteraSection must be used within a Settera component.");
  }
  if (!store) {
    throw new Error("useSetteraSection must be used within a Settera component.");
  }

  const definition = schemaCtx.sectionIndex.get(`${pageKey}:${sectionKey}`);
  if (!definition) {
    if (!schemaCtx.getPageByKey(pageKey)) {
      throw new Error(`Page "${pageKey}" not found in schema.`);
    }
    throw new Error(
      `Section "${sectionKey}" not found in page "${pageKey}".`,
    );
  }

  // Subscribe to values only when visibleWhen exists
  const hasVisibleWhen = definition.visibleWhen !== undefined;
  const allValues = useStoreSelector(
    store,
    (state) => (hasVisibleWhen ? state.values : undefined),
  );
  const isVisible = hasVisibleWhen
    ? evaluateVisibility(definition.visibleWhen, allValues!)
    : true;

  return { isVisible, definition };
}
