import { defineConfig } from "vite";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

// Every projects/*.html is a build input, so detail pages survive `vite build`.
const projectPages = Object.fromEntries(
  readdirSync(resolve(__dirname, "projects"))
    .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
    .map((f) => [`project-${f.replace(/\.html$/, "")}`, resolve(__dirname, "projects", f)])
);

export default defineConfig({
  // Relative so the build works from any subpath (e.g. GitHub Pages).
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ...projectPages,
      },
    },
  },
});
