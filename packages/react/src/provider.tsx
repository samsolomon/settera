import React, { useMemo, useEffect } from "react";
import {
  validateSchema,
  flattenSettings,
  getPageByKey,
  buildSettingIndex,
  buildSectionIndex,
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
    () => {
      const flat = flattenSettings(schema);
      const settingIdx = buildSettingIndex(flat);
      return {
        schema,
        flatSettings: flat,
        getSettingByKey: (key: string) => settingIdx.get(key)?.definition,
        getPageByKey: (key: string) => getPageByKey(schema, key),
        settingIndex: settingIdx,
        sectionIndex: buildSectionIndex(schema),
      };
    },
    [schema],
  );

  return (
    <SetteraSchemaContext.Provider value={schemaContext}>
      {children}
    </SetteraSchemaContext.Provider>
  );
}
