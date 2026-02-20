import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/components/settera": path.resolve(
        __dirname,
        "../shadcn-registry/src/settera",
      ),
      "@/components/ui": path.resolve(__dirname, "src/components/ui"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom", "@settera/react", "@settera/schema", "@settera/ui"],
  },
});
