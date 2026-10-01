// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The college's production home is cPanel shared hosting running a plain Node process, so the
// production build pins Nitro to a Node server: `CAC_TARGET=node bun run build:node`. Without the
// flag the build keeps Lovable's default target, which is what the preview here needs.
const nodeTarget = process.env["CAC_TARGET"] === "node";

export default defineConfig({
  // Omitted entirely unless building for the college's own Node host, so the preview keeps its
  // default target.
  ...(nodeTarget ? { nitro: { preset: "node-server" } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
