import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Deterministic, auto-fixable import/export ordering.
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  // Architectural boundaries — mechanically enforce the dependency direction
  // documented in src/README.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", mode: "full", pattern: "src/app/**" },
        {
          type: "feature",
          mode: "full",
          pattern: "src/features/*/**",
          capture: ["name"],
        },
        { type: "ui", mode: "full", pattern: "src/components/ui/**" },
        {
          type: "shared-ui",
          mode: "full",
          pattern: "src/components/shared/**",
        },
        {
          type: "layout-ui",
          mode: "full",
          pattern: "src/components/layout/**",
        },
        { type: "hooks", mode: "full", pattern: "src/hooks/**" },
        { type: "server", mode: "full", pattern: "src/server/**" },
        { type: "lib", mode: "full", pattern: "src/lib/**" },
        { type: "config", mode: "full", pattern: "src/config/**" },
        { type: "types", mode: "full", pattern: "src/types/**" },
        { type: "env", mode: "file", pattern: "src/env.ts" },
      ],
    },
    rules: {
      "boundaries/no-unknown": "off",
      "boundaries/no-unknown-files": "off",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: {
                to: {
                  type: [
                    "app",
                    "feature",
                    "ui",
                    "shared-ui",
                    "layout-ui",
                    "hooks",
                    "server",
                    "lib",
                    "config",
                    "types",
                    "env",
                  ],
                },
              },
            },
            // A feature may import from itself (same captured name)...
            {
              from: { type: "feature" },
              allow: {
                to: {
                  type: "feature",
                  captured: { name: "{{ from.captured.name }}" },
                },
              },
            },
            // ...and from the shared layers, but never from another feature.
            {
              from: { type: "feature" },
              allow: {
                to: {
                  type: [
                    "ui",
                    "shared-ui",
                    "layout-ui",
                    "hooks",
                    "server",
                    "lib",
                    "config",
                    "types",
                    "env",
                  ],
                },
              },
            },
            {
              from: { type: "layout-ui" },
              allow: {
                to: {
                  type: [
                    "ui",
                    "shared-ui",
                    "hooks",
                    "lib",
                    "config",
                    "types",
                    "env",
                  ],
                },
              },
            },
            {
              from: { type: "shared-ui" },
              allow: {
                to: { type: ["ui", "hooks", "lib", "config", "types", "env"] },
              },
            },
            {
              from: { type: "ui" },
              allow: { to: { type: ["ui", "lib", "config", "types", "env"] } },
            },
            {
              from: { type: "hooks" },
              allow: {
                to: { type: ["hooks", "lib", "config", "types", "env"] },
              },
            },
            {
              from: { type: "server" },
              allow: {
                to: { type: ["server", "lib", "config", "types", "env"] },
              },
            },
            {
              from: { type: "lib" },
              allow: { to: { type: ["lib", "config", "types", "env"] } },
            },
            {
              from: { type: "config" },
              allow: { to: { type: ["config", "types", "env"] } },
            },
            {
              from: { type: "types" },
              allow: { to: { type: ["types"] } },
            },
          ],
        },
      ],
    },
  },

  // Prettier owns formatting — turn off any conflicting ESLint rules. Keep last.
  prettier,

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
