
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS role_occupation text,
  ADD COLUMN IF NOT EXISTS attitude text DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS physical_description text,
  ADD COLUMN IF NOT EXISTS voice_mannerisms text,
  ADD COLUMN IF NOT EXISTS story_role text;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS dm_notes text;
