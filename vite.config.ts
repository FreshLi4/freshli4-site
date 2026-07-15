import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

export default defineConfig({
  plugins: [sites(), cloudflare({ inspectorPort: false, config: { main: "./worker/index.ts", assets: { directory: "./dist/client", binding: "ASSETS", not_found_handling: "single-page-application" }, compatibility_date: "2026-07-15" } })],
  build: { rollupOptions: { input: "index.html" } },
});
