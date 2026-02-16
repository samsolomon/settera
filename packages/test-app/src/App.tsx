import { useState, useCallback } from "react";
import { SCHEMA_VERSION } from "@settera/schema";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { SetteraLayout } from "@settera/ui";
import { demoSchema } from "./schema.js";

export function App() {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Simulate async save to backend (returns Promise → triggers save indicator)
    return new Promise<void>((resolve) => setTimeout(resolve, 800));
  }, []);

  const onAction: Record<string, () => void | Promise<void>> = {
    "actions.export": async () => {
      await new Promise((r) => setTimeout(r, 1500));
      alert("Data exported!");
    },
    "actions.clearCache": () => {
      alert("Cache cleared!");
    },
    "actions.deleteAccount": async () => {
      await new Promise((r) => setTimeout(r, 2000));
      alert("Account deleted (just kidding).");
    },
  };

  const onValidate: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  > = {
    "profile.email": async (value) => {
      await new Promise((r) => setTimeout(r, 500));
      if (value === "taken@example.com") {
        return "This email is already in use";
      }
      return null;
    },
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid #e5e7eb",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h1 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
          Settera Demo
        </h1>
        <p
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            margin: "2px 0 0",
          }}
        >
          Schema v{SCHEMA_VERSION}
        </p>
      </header>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <SetteraProvider schema={demoSchema}>
          <SetteraRenderer
            values={values}
            onChange={handleChange}
            onAction={onAction}
            onValidate={onValidate}
          >
            <SetteraLayout />
          </SetteraRenderer>
        </SetteraProvider>
      </div>
    </div>
  );
}
