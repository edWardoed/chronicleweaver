ALTER TABLE public.characters
  ADD COLUMN sw_attributes jsonb DEFAULT '{"agility":"d4","smarts":"d4","spirit":"d4","strength":"d4","vigor":"d4"}',
  ADD COLUMN sw_skills jsonb DEFAULT '[]',
  ADD COLUMN sw_pace integer DEFAULT 6,
  ADD COLUMN sw_parry integer DEFAULT 2,
  ADD COLUMN sw_toughness integer DEFAULT 2,
  ADD COLUMN sw_wounds integer DEFAULT 0,
  ADD COLUMN sw_fatigue integer DEFAULT 0,
  ADD COLUMN sw_bennies integer DEFAULT 3,
  ADD COLUMN sw_rank text DEFAULT 'Novice';

DROP VIEW IF EXISTS public.characters_safe;

CREATE VIEW public.characters_safe AS
SELECT
  id, adventure_id, created_at, updated_at,
  name, type, avatar_url,
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
  sw_attributes, sw_skills, sw_pace, sw_parry, sw_toughness,
  sw_wounds, sw_fatigue, sw_bennies, sw_rank,
  CASE
    WHEN (dm_notes_visible = true) OR has_role(auth.uid(), 'admin'::app_role) OR (get_adventure_role(auth.uid(), adventure_id) = 'dm'::text) THEN notes
    ELSE NULL::text
  END AS notes
FROM characters
WHERE has_adventure_access(auth.uid(), adventure_id);