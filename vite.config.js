import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./src/manifest.json" assert { type: "json" }

// MV3 extension build powered by @crxjs/vite-plugin.
// HMR works for popup/side panel during `npm run dev`.
export default defineConfig({
  plugins: [preact(), crx({ manifest })],
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
})
