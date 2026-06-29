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
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
