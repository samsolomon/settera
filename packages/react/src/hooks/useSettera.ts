import { useContext } from "react";
import { SetteraSchemaContext, SetteraValuesContext } from "../context.js";

/**
 * Access the full schema and values state.
 * Must be used within both SetteraProvider and SetteraRenderer.
 */
export function useSettera() {
  const schemaCtx = useContext(SetteraSchemaContext);
  const valuesCtx = useContext(SetteraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSettera must be used within a SetteraProvider.");
  }
  if (!valuesCtx) {
    throw new Error("useSettera must be used within a SetteraRenderer.");
  }

  return {
    schema: schemaCtx.schema,
    values: valuesCtx.values,
    setValue: valuesCtx.setValue,
    validate: valuesCtx.onValidate,
  };
}
