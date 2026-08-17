ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS session_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS people_count integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS ambiance text,
  ADD COLUMN IF NOT EXISTS vibe text,
  ADD COLUMN IF NOT EXISTS has_cake boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_age_number boolean NOT NULL DEFAULT false;