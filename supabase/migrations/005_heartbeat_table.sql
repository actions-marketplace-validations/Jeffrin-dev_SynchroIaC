-- Heartbeat table for activity tracking.
--
-- Headless-first architecture note:
-- All business logic, validation, authentication, billing checks, and data access
-- enforcement are handled exclusively in the server-side API layer using the
-- Supabase service role key. Frontend clients must not call the database
-- directly. Row Level Security is intentionally disabled on all tables below
-- because access is controlled entirely by the API layer.

create table heartbeat (
  id uuid primary key default gen_random_uuid(),
  pinged_at timestamptz not null default now()
);

alter table heartbeat disable row level security;
