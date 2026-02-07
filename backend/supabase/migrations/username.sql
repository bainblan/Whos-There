-- MVP OPEN MODE: no auth, public table

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public."Username" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS for MVP demo
ALTER TABLE public."Username" DISABLE ROW LEVEL SECURITY;
