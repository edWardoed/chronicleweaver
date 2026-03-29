
-- 1. Recreate characters_safe view WITHOUT security_invoker (runs as owner, bypasses RLS)
--    Keep security_barrier for safety. Add WHERE clause for adventure access.
DROP VIEW IF EXISTS public.characters_safe;
CREATE VIEW public.characters_safe
WITH (security_barrier=true, security_invoker=false) AS
SELECT
  id, adventure_id, created_at, updated_at, name, type, avatar_url,
  class, subclass, race, background, alignment,
  level, experience_points,
  str_score, dex_score, con_score, int_score, wis_score, cha_score,
  armor_class, initiative_override, speed,
  max_hp, current_hp, temp_hp,
  hit_dice, death_save_successes, death_save_failures,
  saving_throw_proficiencies, skill_proficiencies, skill_half_proficiencies,
  proficiencies_languages, equipment, features_traits,
  spell_slots, spellcasting_ability, spells,
  personality_traits, ideals, bonds, flaws,
  role_occupation, attitude, physical_description, voice_mannerisms, story_role,
  dm_notes_visible, created_by,
  CASE
    WHEN (dm_notes_visible = true)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (get_adventure_role(auth.uid(), adventure_id) = 'dm')
    THEN notes
    ELSE NULL::text
  END AS notes
FROM public.characters
WHERE has_adventure_access(auth.uid(), adventure_id);

-- 2. Recreate locations_safe view WITHOUT security_invoker
DROP VIEW IF EXISTS public.locations_safe;
CREATE VIEW public.locations_safe
WITH (security_barrier=true, security_invoker=false) AS
SELECT
  id, adventure_id, created_at, updated_at,
  name, type, image_url, description, notes, dm_notes_visible,
  CASE
    WHEN (dm_notes_visible = true)
      OR has_role(auth.uid(), 'admin'::app_role)
      OR (get_adventure_role(auth.uid(), adventure_id) = 'dm')
    THEN dm_notes
    ELSE NULL::text
  END AS dm_notes
FROM public.locations
WHERE has_adventure_access(auth.uid(), adventure_id);

-- 3. Restrict base table SELECT to DMs/admins only (players must use _safe views)
-- Characters: drop the broad SELECT, replace with DM/admin only
DROP POLICY IF EXISTS "Users can view characters" ON public.characters;
CREATE POLICY "DM/Admin can select characters"
ON public.characters FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR get_adventure_role(auth.uid(), adventure_id) = 'dm'
);

-- Locations: drop the broad SELECT, replace with DM/admin only
DROP POLICY IF EXISTS "Users can view locations" ON public.locations;
CREATE POLICY "DM/Admin can select locations"
ON public.locations FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR get_adventure_role(auth.uid(), adventure_id) = 'dm'
);

-- 4. Grant SELECT on the views to authenticated (anon shouldn't need it)
GRANT SELECT ON public.characters_safe TO authenticated;
GRANT SELECT ON public.locations_safe TO authenticated;
