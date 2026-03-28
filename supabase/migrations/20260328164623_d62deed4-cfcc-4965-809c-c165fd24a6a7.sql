
-- Create security-barrier view for locations that conditionally hides dm_notes
CREATE VIEW public.locations_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id, adventure_id, created_at, updated_at, name, type, image_url,
  description, notes, dm_notes_visible,
  CASE
    WHEN dm_notes_visible = true
      OR has_role(auth.uid(), 'admin'::app_role)
      OR get_adventure_role(auth.uid(), adventure_id) = 'dm'
    THEN dm_notes
    ELSE NULL
  END AS dm_notes
FROM public.locations;

-- Create security-barrier view for characters that conditionally hides notes (DM notes)
CREATE VIEW public.characters_safe
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  id, adventure_id, created_at, updated_at, name, type, avatar_url,
  class, subclass, race, background, alignment, level, experience_points,
  str_score, dex_score, con_score, int_score, wis_score, cha_score,
  armor_class, initiative_override, speed, max_hp, current_hp, temp_hp,
  hit_dice, death_save_successes, death_save_failures,
  saving_throw_proficiencies, skill_proficiencies, skill_half_proficiencies,
  proficiencies_languages, equipment, features_traits,
  spell_slots, spellcasting_ability, spells,
  personality_traits, ideals, bonds, flaws,
  role_occupation, attitude, physical_description, voice_mannerisms,
  story_role, dm_notes_visible, created_by,
  CASE
    WHEN dm_notes_visible = true
      OR has_role(auth.uid(), 'admin'::app_role)
      OR get_adventure_role(auth.uid(), adventure_id) = 'dm'
    THEN notes
    ELSE NULL
  END AS notes
FROM public.characters;
