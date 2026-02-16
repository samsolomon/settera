import { useContext } from "react";
import { SettaraSchemaContext, SettaraValuesContext } from "../context.js";

/**
 * Access the full schema and values state.
 * Must be used within both SettaraProvider and SettaraRenderer.
 */
export function useSettara() {
  const schemaCtx = useContext(SettaraSchemaContext);
  const valuesCtx = useContext(SettaraValuesContext);

  if (!schemaCtx) {
    throw new Error("useSettara must be used within a SettaraProvider.");
  }
  if (!valuesCtx) {
    throw new Error("useSettara must be used within a SettaraRenderer.");
  }

  return {
    schema: schemaCtx.schema,
    values: valuesCtx.values,
    setValue: valuesCtx.setValue,
    validate: valuesCtx.onValidate,
  };
}
