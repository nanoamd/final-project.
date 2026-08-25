import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit and component tests. End-to-end tests live in ./e2e and run under
// Playwright instead (see playwright.config.ts).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" alias from tsconfig natively (Vite built-in).
    tsconfigPaths: true,
    alias: {
      // `import "server-only"` throws by design when a module is pulled into a
      // client bundle, and jsdom looks like one to it. The guard is worth
      // keeping in the source — it is what stops a secret-holding module
      // reaching the browser — so it is stubbed for tests rather than removed
      // there. Without this no server-side module can be unit-tested at all,
      // which is why the email templates had no tests until now.
      "server-only": path.resolve(
        import.meta.dirname,
        "vitest.server-only-stub.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // scripts/ is included because the one-off data scripts carry logic worth
    // pinning — title repair, category inference — and testing the pure
    // function is cheaper than discovering the rule was wrong after it has
    // rewritten 26 product names.
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
