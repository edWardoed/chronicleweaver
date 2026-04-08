

## Add Savage Worlds Game System Support

### Summary
Add "Savage Worlds" as a second game system option. This includes new database columns for SW-specific mechanics, a new PC character sheet, a new condensed NPC sheet, and routing logic to show the correct sheet based on the adventure's game system.

### Database Migration
Add 9 new columns to the `characters` table for Savage Worlds mechanics. Reuse existing columns (`race`, `equipment`, `features_traits`, `flaws`, `personality_traits`, `notes`, `role_occupation`, `attitude`, etc.) where they map naturally.

```sql
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
```

### Column Reuse Strategy
| SW Concept | Existing Column |
|---|---|
| Race/Ancestry | `race` |
| Gear | `equipment` (JSONB) |
| Edges | `features_traits` (rich text) |
| Hindrances | `flaws` (text) |
| Concept/Personality | `personality_traits` |
| Notes | `notes` (rich text) |
| NPC Role | `role_occupation` |
| NPC Attitude | `attitude` |
| NPC Descriptions | `physical_description`, `voice_mannerisms`, `story_role` |

### File Changes

**1. `src/hooks/useCharacters.ts`** — Add 9 new SW fields to `CharacterRow` interface.

**2. `src/pages/SWCharacterSheet.tsx`** — New file (~400 lines). Full Savage Worlds PC sheet with sections:
- Header: Name, Race, Rank (Novice/Seasoned/Veteran/Heroic/Legendary), Avatar
- Attributes: 5 attributes (Agility, Smarts, Spirit, Strength, Vigor) with die-type selectors (d4–d12)
- Derived Stats: Pace, Parry, Toughness (editable overrides)
- Wounds (0–3 checkboxes) and Fatigue (0–2 checkboxes), Bennies counter
- Skills: Dynamic list of skill name + die type pairs
- Edges (rich text via TipTap, reusing `features_traits`)
- Hindrances (text, reusing `flaws`)
- Gear (reusing `equipment` JSONB with name/quantity/weight)
- Personality (reusing `personality_traits`)
- Notes (rich text via TipTap)
- Same save/autosave/delete pattern as existing sheets

**3. `src/pages/SWNPCSheet.tsx`** — New file (~250 lines). Condensed NPC sheet with:
- Header: Name, Role/Occupation, Attitude, Avatar
- Attributes: 5 attributes as die types (compact row)
- Derived Stats: Pace, Parry, Toughness
- Key Skills: Dynamic list
- Special Abilities (rich text, reusing `features_traits`)
- Description: Physical, Voice & Mannerisms
- Story Role
- DM Notes (rich text with visibility toggle)
- Same save/delete pattern as existing NPCSheet

**4. `src/App.tsx`** — Update `CharacterSheetRouter` to also fetch the adventure and check `game_system`. Route to SW sheets when game system is "Savage Worlds":
- `Savage Worlds` + `PC` → `SWCharacterSheet`
- `Savage Worlds` + `NPC` → `SWNPCSheet`
- `D&D 5E` + `PC` → `CharacterSheet` (existing)
- `D&D 5E` + `NPC` → `NPCSheet` (existing)

**5. `src/components/CreateAdventureModal.tsx`** — Add `'Savage Worlds'` to the `GAME_SYSTEMS` array.

### UI Design Notes
- Die-type selectors use a `Select` dropdown with options: d4, d6, d8, d10, d12, d12+1, d12+2
- Wounds displayed as 3 checkboxes (Incapacitated label at 3)
- Fatigue displayed as 2 checkboxes (Incapacitated label at 2)
- Bennies as a simple numeric counter with +/- buttons
- Skills list has Add/Remove with name input + die select per row
- All styling matches existing dark theme with gold headings

