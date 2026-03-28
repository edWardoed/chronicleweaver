

## Plan: Allow Players & Scribes to Own 1 PC Per Adventure

### Summary
Players and scribes can each create and edit **one player character (PC)** per adventure. DMs retain full control over all characters and NPCs.

### Database Changes

1. **Add `created_by` column to `characters` table** (migration)
   - `ALTER TABLE characters ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;`
   - Set existing characters' `created_by` to null (no owner)

2. **Add RLS policies for player/scribe PC ownership**:
   - **INSERT policy**: Players and scribes with adventure access can insert a PC if they don't already have one in that adventure. Uses a subquery check: `NOT EXISTS (SELECT 1 FROM characters WHERE adventure_id = ... AND created_by = auth.uid() AND type = 'PC')`. The `created_by` must equal `auth.uid()` and `type` must be `'PC'`.
   - **UPDATE policy**: Players and scribes can update characters where `created_by = auth.uid()` and `type = 'PC'`.
   - **DELETE policy**: Players and scribes can delete their own PC (`created_by = auth.uid()` and `type = 'PC'`).

3. **Create a security definer function** `owns_character_pc` to safely check if a user already has a PC in an adventure (avoids RLS recursion).

### Frontend Changes

4. **`useAdventureRole.ts`** — Remove `canEditCharacters: effectiveRole === 'dm'` restriction. Add a new helper like `canCreatePC` and `canEditOwnPC`.

5. **`useCharacters.ts`** — Update `useCreateCharacter` to include `created_by` (current user ID) in the insert payload.

6. **`CharacterList.tsx`** — Key changes:
   - Players/scribes see an "Add Character" button but only for PCs, and only if they don't already have one
   - Players/scribes can only edit/delete their own PC (check `created_by` against current user)
   - DMs see the full UI (create any type, edit/delete all)
   - Hide NPC creation option for non-DM roles

7. **`CharacterSheet.tsx`** — Add ownership check: non-DM users can only edit if `character.created_by === currentUser.id` and `character.type === 'PC'`. Otherwise render read-only.

### Technical Details

- The 1-PC-per-adventure limit is enforced at both the database level (RLS insert policy with NOT EXISTS check) and the UI level (hiding the button when a PC already exists).
- `created_by` is nullable to handle legacy/DM-created characters.
- DM policies (`get_adventure_role = 'dm'`) and admin policies remain unchanged and take precedence.

