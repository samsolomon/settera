import { SCHEMA_VERSION, greet } from "@settara/schema";
import { useSettingsPlaceholder } from "@settara/react";
import { UI_PLACEHOLDER } from "@settara/ui";

export function App() {
  const hookResult = useSettingsPlaceholder();

  return (
    <div>
      <h1>Settara Test App</h1>
      <ul>
        <li>Schema version: {SCHEMA_VERSION}</li>
        <li>Greet: {greet("Settara")}</li>
        <li>Hook: {hookResult}</li>
        <li>UI: {UI_PLACEHOLDER}</li>
      </ul>
    </div>
  );
}
