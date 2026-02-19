import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface RegistryFile {
  path: string;
  type: string;
  target: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

interface Registry {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}

const registry: Registry = JSON.parse(
  readFileSync(join(__dirname, "registry.json"), "utf-8"),
);

const output = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: registry.name,
  homepage: registry.homepage,
  items: registry.items.map((item) => ({
    ...item,
    files: item.files.map((file) => {
      const content = readFileSync(join(__dirname, file.path), "utf-8");
      return {
        path: file.target,
        type: file.type,
        content,
        target: file.target,
      };
    }),
  })),
};

const outDir = join(__dirname, "r");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "settera.json"),
  JSON.stringify(output, null, 2) + "\n",
);

console.log(`Built r/settera.json (${output.items[0].files.length} files)`);
