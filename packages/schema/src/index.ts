export const SCHEMA_VERSION = "0.0.0";

export function greet(name: string): string {
  return `Hello, ${name}! (schema v${SCHEMA_VERSION})`;
}
