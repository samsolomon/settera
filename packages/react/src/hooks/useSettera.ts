import { useContext } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";
import { useStoreSelector } from "./useStoreSelector.js";

/**
 * Access the full schema and values state.
 * Must be used within both SetteraProvider and SetteraRenderer.
 */
export function useSettera() {
  const schemaCtx = useContext(SetteraSchemaContext);
  const store = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSettera must be used within a SetteraProvider.");
  }
  if (!store) {
    throw new Error("useSettera must be used within a SetteraRenderer.");
  }

  const values = useStoreSelector(store, (state) => state.values);

  return {
    schema: schemaCtx.schema,
    values,
    setValue: store.setValue,
    validate: store.getOnValidate(),
  };
}
