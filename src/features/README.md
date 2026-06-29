# features

Domain modules organized as vertical slices. Each feature owns its components,
hooks, server actions, schemas, and types.

```
features/<name>/
├── components/
├── hooks/
├── actions/
├── schemas/
├── types.ts
└── index.ts   # public surface — import the feature from here
```

Rules:

- Features must not import from other features. Share via `components/shared/` or `server/`.
- Consume a feature through its `index.ts` barrel, not its internal files.
