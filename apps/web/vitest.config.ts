import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // src/env.test.ts asserts server-only env access via @t3-oss/env-nextjs,
    // which gates server vars on `typeof window === "undefined"` — it needs
    // a real Node (no `window`) environment, not jsdom's. Every other test
    // file (component/page renders) needs jsdom's DOM globals.
    environmentMatchGlobs: [["src/env.test.ts", "node"]],
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
