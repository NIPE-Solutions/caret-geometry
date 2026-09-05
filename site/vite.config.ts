import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const directory = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root: resolve(directory),
  server: { port: 4183, strictPort: true },
  build: {
    outDir: resolve(directory, "../dist-site"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(directory, "index.html"),
        lab: resolve(directory, "lab.html"),
      },
    },
  },
});
