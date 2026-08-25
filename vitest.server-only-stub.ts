/**
 * Stands in for the `server-only` package under Vitest.
 *
 * That package exists to throw at build time if a server module is imported
 * into a client bundle, and it decides which it is from the bundler's
 * environment — jsdom reads as a browser, so every `import "server-only"`
 * module throws on import and cannot be tested. Aliased in vitest.config.ts.
 */
export {};
