# Source Architecture

This codebase uses a **feature-first (vertical slice)** architecture with a small
set of shared horizontal layers and an **enforced dependency direction**. The goal
is that adding the 50th feature looks exactly like adding the 1st, and removing a
feature means deleting a single folder.

## Layers

| Layer         | Path                 | Responsibility                                                                   |
| ------------- | -------------------- | -------------------------------------------------------------------------------- |
| Routing       | `app/`               | Next.js App Router. Thin layouts, pages, and route handlers. No business logic.  |
| UI primitives | `components/ui/`     | shadcn/ui generated primitives. App-agnostic, no feature imports.                |
| Shared UI     | `components/shared/` | Composite components reused across features.                                     |
| Layout UI     | `components/layout/` | App shell: header, footer, navigation.                                           |
| Features      | `features/`          | Domain modules (vertical slices). The heart of the app.                          |
| Shared hooks  | `hooks/`             | Globally-reused React hooks.                                                     |
| Libraries     | `lib/`               | Leaf utilities and third-party client setup (Supabase, Stripe, Sanity).          |
| Server logic  | `server/`            | **Server-only.** Data access, server actions, webhook processing. Holds secrets. |
| Config        | `config/`            | Site config, constants, route map, feature flags.                                |
| Types         | `types/`             | Globally-shared TypeScript types.                                                |

## Dependency direction

```
app  →  features  →  components/shared  →  components/ui
  ↘          ↓               ↓
         server   →    lib   →   config / types   (leaves)
```

Rules:

- **`server/` is server-only.** Every module imports the `server-only` package so an
  accidental client import fails the build. Secrets (Stripe secret key, Supabase
  service-role key) live here and nowhere else.
- **`components/ui/` are pure primitives** — they never import from `features/`.
- **Features do not import other features.** Share via `components/shared/` or `server/`.
- **`config/` and `types/` are leaves** — importable by anything, importing nothing internal.

These rules will be enforced mechanically by ESLint import rules (see linting setup).

## Anatomy of a feature

```
features/<name>/
├── components/    # feature-scoped React components
├── hooks/         # feature-scoped hooks
├── actions/       # server actions for this feature
├── schemas/       # Zod schemas (validation + inferred types)
├── types.ts       # feature-local types
└── index.ts       # public surface of the feature (import from here)
```

Import a feature through its `index.ts` barrel, not its internal files, so the
public surface stays intentional.

## Import alias

A single alias `@/*` maps to `src/*` (e.g. `@/lib/utils`, `@/features/...`,
`@/components/ui/button`).
