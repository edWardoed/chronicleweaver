
-- Add adventure_role enum
CREATE TYPE public.adventure_role AS ENUM ('dm', 'scribe', 'viewer');

-- Add role column to adventure_access
ALTER TABLE public.adventure_access ADD COLUMN role adventure_role NOT NULL DEFAULT 'viewer';

-- Helper function to get a user's role for a specific adventure
CREATE OR REPLACE FUNCTION public.get_adventure_role(_user_id uuid, _adventure_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.adventure_access
  WHERE user_id = _user_id AND adventure_id = _adventure_id
  LIMIT 1
$$;

-- DM full access on entries
CREATE POLICY "DM full access entries"
ON public.entries FOR ALL TO authenticated
USING (get_adventure_role(auth.uid(), adventure_id) = 'dm')
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'dm');

-- Scribe can insert entries
CREATE POLICY "Scribe can insert entries"
ON public.entries FOR INSERT TO authenticated
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'scribe');

-- Scribe can update entries
CREATE POLICY "Scribe can update entries"
ON public.entries FOR UPDATE TO authenticated
USING (get_adventure_role(auth.uid(), adventure_id) = 'scribe')
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'scribe');

-- DM full access on locations
CREATE POLICY "DM full access locations"
ON public.locations FOR ALL TO authenticated
USING (get_adventure_role(auth.uid(), adventure_id) = 'dm')
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'dm');

-- Scribe can insert locations
CREATE POLICY "Scribe can insert locations"
ON public.locations FOR INSERT TO authenticated
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'scribe');

-- Scribe can update locations
CREATE POLICY "Scribe can update locations"
ON public.locations FOR UPDATE TO authenticated
USING (get_adventure_role(auth.uid(), adventure_id) = 'scribe')
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'scribe');

-- DM full access on characters
CREATE POLICY "DM full access characters"
ON public.characters FOR ALL TO authenticated
USING (get_adventure_role(auth.uid(), adventure_id) = 'dm')
WITH CHECK (get_adventure_role(auth.uid(), adventure_id) = 'dm');

-- DM full access on entry_characters
CREATE POLICY "DM full access entry_characters"
ON public.entry_characters FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_characters.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'dm'))
WITH CHECK (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_characters.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'dm'));

-- Scribe can manage entry_characters (needed for linking chars to entries)
CREATE POLICY "Scribe can manage entry_characters"
ON public.entry_characters FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_characters.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'scribe'))
WITH CHECK (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_characters.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'scribe'));

-- DM full access on entry_locations
CREATE POLICY "DM full access entry_locations"
ON public.entry_locations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_locations.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'dm'))
WITH CHECK (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_locations.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'dm'));

-- Scribe can manage entry_locations
CREATE POLICY "Scribe can manage entry_locations"
ON public.entry_locations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_locations.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'scribe'))
WITH CHECK (EXISTS (SELECT 1 FROM entries e WHERE e.id = entry_locations.entry_id AND get_adventure_role(auth.uid(), e.adventure_id) = 'scribe'));
