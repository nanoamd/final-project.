# config

Application configuration: site metadata, constants, the route map, navigation
definitions, and feature flags. Leaf layer — importable everywhere, imports nothing
internal. Values sourced from the environment come through the validated env module,
not `process.env` directly.
