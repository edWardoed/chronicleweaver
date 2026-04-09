DROP VIEW IF EXISTS public.characters_safe CASCADE;

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS pf_proficiencies jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pf_feats jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pf_hero_points integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pf_key_ability text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pf_heritage text DEFAULT NULL;

CREATE VIEW public.characters_safe AS
SELECT
  id, adventure_id, name, type, avatar_url, created_at, updated_at,
  class, subclass, race, background, alignment, level, experience_points,
  str_score, dex_score, con_score, int_score, wis_score, cha_score,
  armor_class, initiative_override, speed, max_hp, current_hp, temp_hp,
  hit_dice, death_save_successes, death_save_failures,
  saving_throw_proficiencies, skill_proficiencies, skill_half_proficiencies,
  proficiencies_languages, equipment, features_traits,
  spell_slots, spellcasting_ability, spells,
  personality_traits, ideals, bonds, flaws,
  role_occupation, attitude, physical_description, voice_mannerisms, story_role,
  dm_notes_visible, created_by,
  CASE
    WHEN dm_notes_visible THEN notes
    WHEN (SELECT get_adventure_role(auth.uid(), adventure_id)) IN ('dm') THEN notes
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN notes
    ELSE NULL
  END AS notes,
  sw_attributes, sw_skills, sw_pace, sw_parry, sw_toughness,
  sw_wounds, sw_fatigue, sw_bennies, sw_rank,
  pf_proficiencies, pf_feats, pf_hero_points, pf_key_ability, pf_heritage
FROM public.characters
WHERE
  has_role(auth.uid(), 'admin'::app_role)
  OR (get_adventure_role(auth.uid(), adventure_id) = 'dm')
  OR (get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe'));