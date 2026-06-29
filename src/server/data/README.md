# server/data

Data-access layer. Repositories and typed query functions against Supabase/Postgres.
Application code calls these functions instead of querying the database directly,
keeping data access in one auditable place.
