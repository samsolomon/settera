import { defineConfig, mergeConfig } from "vitest/config";
import { sharedConfig } from "../../vitest.shared.ts";
import path from "path";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/__tests__/setup.ts"],
    },
    resolve: {
      alias: {
        "@/components/ui": path.resolve(
          __dirname,
          "../shadcn-test-app/src/components/ui",
        ),
        "@/lib": path.resolve(__dirname, "../shadcn-test-app/src/lib"),
        "@": path.resolve(__dirname, "../shadcn-test-app/src"),
      },
    },
  }),
);
