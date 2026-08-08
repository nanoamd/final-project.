import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit and component tests. End-to-end tests live in ./e2e and run under
// Playwright instead (see playwright.config.ts).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" alias from tsconfig natively (Vite built-in).
    tsconfigPaths: true,
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
