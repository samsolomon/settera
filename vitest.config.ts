import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/schema/vitest.config.ts",
      "packages/react/vitest.config.ts",
      "packages/ui/vitest.config.ts",
      "packages/shadcn-registry/vitest.config.ts",
    ],
  },
});
