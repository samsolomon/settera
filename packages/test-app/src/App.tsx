import { useState, useCallback } from "react";
import { SCHEMA_VERSION } from "@settara/schema";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { SettingRow, BooleanSwitch } from "@settara/ui";
import { demoSchema } from "./schema.js";

export function App() {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "24px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "4px",
        }}
      >
        Settara Demo
      </h1>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: "32px",
        }}
      >
        Schema v{SCHEMA_VERSION} — Boolean settings vertical slice
      </p>

      <SettaraProvider schema={demoSchema}>
        <SettaraRenderer values={values} onChange={handleChange}>
          {/* General > Behavior */}
          <SectionHeading>Behavior</SectionHeading>
          <SettingRow settingKey="general.autoSave">
            <BooleanSwitch settingKey="general.autoSave" />
          </SettingRow>
          <SettingRow settingKey="general.notifications">
            <BooleanSwitch settingKey="general.notifications" />
          </SettingRow>
          <SettingRow settingKey="general.sounds">
            <BooleanSwitch settingKey="general.sounds" />
          </SettingRow>

          {/* General > Security */}
          <SectionHeading>Security</SectionHeading>
          <SettingRow settingKey="security.ssoEnabled">
            <BooleanSwitch settingKey="security.ssoEnabled" />
          </SettingRow>
          <SettingRow settingKey="security.mfa">
            <BooleanSwitch settingKey="security.mfa" />
          </SettingRow>

          {/* Advanced > Experimental */}
          <SectionHeading>Experimental</SectionHeading>
          <SettingRow settingKey="advanced.experimental">
            <BooleanSwitch settingKey="advanced.experimental" />
          </SettingRow>
          <SettingRow settingKey="advanced.debug">
            <BooleanSwitch settingKey="advanced.debug" />
          </SettingRow>
          <SettingRow settingKey="advanced.betaUpdates">
            <BooleanSwitch settingKey="advanced.betaUpdates" />
          </SettingRow>
        </SettaraRenderer>
      </SettaraProvider>

      {/* Debug: current values */}
      <details style={{ marginTop: "32px" }}>
        <summary
          style={{ cursor: "pointer", fontSize: "13px", color: "#9ca3af" }}
        >
          Debug: Current Values
        </summary>
        <pre
          style={{
            fontSize: "12px",
            backgroundColor: "#f9fafb",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "8px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(values, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "#9ca3af",
        marginTop: "24px",
        marginBottom: "8px",
      }}
    >
      {children}
    </h2>
  );
}
