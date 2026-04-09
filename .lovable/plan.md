

## Add Pathfinder Game System Support

### Summary
Add "Pathfinder" as a third game system. Pathfinder 2E shares the same 6 ability scores and many structural elements with D&D 5E, but has a distinct proficiency rank system (Untrained/Trained/Expert/Master/Legendary), ancestry/heritage instead of race, and Hero Points. New database columns store PF-specific data; existing columns are reused where they map naturally.

### Database Migration
Add 5 new columns to the `characters` table:

```sql
ALTER TABLE public.characters
  ADD COLUMN pf_proficiencies jsonb DEFAULT '{}',
  ADD COLUMN pf_feats jsonb DEFAULT '[]',
  ADD COLUMN pf_hero_points integer DEFAULT 1,
  ADD COLUMN pf_key_ability text DEFAULT NULL,
  ADD COLUMN pf_heritage text DEFAULT NULL;
```

- `pf_proficiencies`: stores proficiency ranks for skills, saves, perception, weapons, armor as `{ "Acrobatics": "trained", "fortitude": "expert", "perception": "master", ... }`
- `pf_feats`: array of `{ name, type, level, notes }` where type is ancestry/class/skill/general
- `pf_hero_points`: 0-3 counter (like Bennies)
- `pf_key_ability`: class key ability (STR, DEX, etc.)
- `pf_heritage`: e.g. "Versatile Heritage" (ancestry stored in existing `race` column)

Update `characters_safe` view to include the new columns.

### Column Reuse Strategy
| PF Concept | Existing Column |
|---|---|
| Ancestry | `race` |
| Class / Subclass | `class`, `subclass` |
| Background | `background` |
| Alignment | `alignment` |
| Level / XP | `level`, `experience_points` |
| 6 Ability Scores | `str_score` through `cha_score` |
| AC, Speed, HP | `armor_class`, `speed`, `max_hp`, `current_hp`, `temp_hp` |
| Gear | `equipment` (JSONB) |
| Spells | `spells`, `spell_slots`, `spellcasting_ability` |
| Notes | `notes` (rich text) |
| Personality | `personality_traits`, `ideals`, `bonds`, `flaws` |
| NPC fields | `role_occupation`, `attitude`, `physical_description`, `voice_mannerisms`, `story_role` |

### File Changes

**1. `src/hooks/useCharacters.ts`** — Add 5 new PF fields to `CharacterRow` interface.

**2. `src/pages/PFCharacterSheet.tsx`** — New file (~500 lines). Full Pathfinder 2E PC sheet:
- Header: Name, Ancestry (reuse `race`), Heritage, Class/Subclass, Background, Level, Key Ability, Avatar
- Ability Scores: 6 scores with modifier calculation (same formula as D&D)
- Proficiency Ranks: Perception, Fortitude/Reflex/Will saves — each with a rank selector (U/T/E/M/L)
- Skills: Pathfinder 2E skill list with proficiency rank selectors per skill
- Derived Stats: AC, HP, Speed (editable)
- Hero Points: 0-3 counter with +/- buttons
- Feats: Organized by type (Ancestry, Class, Skill, General) — dynamic add/remove list with name, level, notes
- Equipment: Reuse existing gear list (name/quantity/weight)
- Spells: Reuse existing spell system
- Personality & Notes: Reuse existing rich text fields
- Same save/autosave/delete pattern as existing sheets

**3. `src/pages/PFNPCSheet.tsx`** — New file (~280 lines). Condensed NPC sheet:
- Header: Name, Role/Occupation, Attitude, Level, Avatar
- Ability Scores: Compact row of 6 scores
- Key Stats: AC, HP, Speed, Perception (with proficiency rank)
- Saves: Fortitude, Reflex, Will with proficiency ranks
- Skills: Dynamic list with proficiency ranks
- Special Abilities (rich text, reusing `features_traits`)
- Description: Physical, Voice & Mannerisms, Story Role
- DM Notes with visibility toggle
- Same save/delete pattern as existing NPCSheet

**4. `src/App.tsx`** — Update `CharacterSheetRouter` to handle three systems:
```
Pathfinder + PC  → PFCharacterSheet
Pathfinder + NPC → PFNPCSheet
Savage Worlds + PC  → SWCharacterSheet
Savage Worlds + NPC → SWNPCSheet
D&D 5E + PC  → CharacterSheet
D&D 5E + NPC → NPCSheet
```

**5. `src/components/CreateAdventureModal.tsx`** — Add `'Pathfinder'` to the `GAME_SYSTEMS` array.

### UI Design Notes
- Proficiency rank selectors use a compact `Select` with options: U (Untrained), T (Trained), E (Expert), M (Master), L (Legendary)
- Proficiency bonus calculation: Untrained=0, Trained=level+2, Expert=level+4, Master=level+6, Legendary=level+8
- Hero Points displayed as 3 pips (similar to SW wounds checkboxes)
- Feats section has tabs or collapsible groups by feat type
- Skills list uses the Pathfinder 2E skill list (Acrobatics, Arcana, Athletics, Crafting, Deception, Diplomacy, Intimidation, Lore, Medicine, Nature, Occultism, Performance, Religion, Society, Stealth, Survival, Thievery)
- All styling matches existing dark theme with gold headings

