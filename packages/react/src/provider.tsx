import React, { useMemo, useEffect } from "react";
import {
  validateSchema,
  flattenSettings,
  getSettingByKey,
  getPageByKey,
  resolveDependencies,
} from "@settera/schema";
import type { SetteraSchema } from "@settera/schema";
import { SetteraSchemaContext } from "./context.js";
import type { SetteraSchemaContextValue } from "./context.js";

export interface SetteraProviderProps {
  schema: SetteraSchema;
  children: React.ReactNode;
}

export function SetteraProvider({ schema, children }: SetteraProviderProps) {
  // Validate schema on mount (warn, don't throw)
  useEffect(() => {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      for (const error of errors) {
        console.warn(
          `[settera] Schema validation: ${error.code} at ${error.path} — ${error.message}`,
        );
      }
    }
  }, [schema]);

  // Memoize schema context (stable after mount)
  const schemaContext: SetteraSchemaContextValue = useMemo(
    () => ({
      schema,
      flatSettings: flattenSettings(schema),
      getSettingByKey: (key: string) => getSettingByKey(schema, key),
      getPageByKey: (key: string) => getPageByKey(schema, key),
      dependencies: resolveDependencies(schema),
    }),
    [schema],
  );

  return (
    <SetteraSchemaContext.Provider value={schemaContext}>
      {children}
    </SetteraSchemaContext.Provider>
  );
}
