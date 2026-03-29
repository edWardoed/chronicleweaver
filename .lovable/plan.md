

## Plan: Allow Scribes to Create & Edit NPCs

### Summary
Expand scribe permissions so they can create and edit NPCs in addition to their one PC. DMs retain full control.

### Database Changes (1 migration)

1. **Update RLS policies on `characters` table**:
   - **INSERT**: Add a new policy allowing scribes to insert NPCs (`type = 'NPC'` and `created_by = auth.uid()` and role is `scribe`)
   - **UPDATE**: Add a new policy allowing scribes to update NPCs they created (`type = 'NPC'` and `created_by = auth.uid()` and role is `scribe`)
   - **DELETE**: Add a new policy allowing scribes to delete NPCs they created (`type = 'NPC'` and `created_by = auth.uid()` and role is `scribe`)

   Alternatively, broaden the existing `Player/Scribe can insert/update/delete own PC` policies to also cover scribe+NPC. Since scribes should be able to create *any number* of NPCs (no limit like PCs), it's cleaner to add separate scribe-NPC policies.

2. **Update `characters_safe` view**: No changes needed — the view already returns all characters the user can SELECT.

### Frontend Changes

3. **`src/hooks/useAdventureRole.ts`** — Add `canCreateNPC` helper: `effectiveRole === 'dm' || effectiveRole === 'scribe'`.

4. **`src/components/CharacterList.tsx`**:
   - Scribes see the "Add Character" button with the option to create NPCs (in addition to their one PC)
   - When a scribe opens the create dialog, show the PC/NPC radio (like DMs), but PC option is disabled if they already have one
   - Scribes can edit/delete NPCs they created (`created_by === userId` and `type === 'NPC'`), plus their own PC

5. **`src/pages/CharacterSheet.tsx`**:
   - Update `canEditThisChar` logic: also allow editing if the user is a scribe and `character.created_by === user.id` (covers both their PC and their NPCs)

### Technical Details
- NPC creation by scribes has no limit (unlike the 1-PC rule)
- Scribe NPC ownership is tracked via `created_by` — scribes can only edit/delete NPCs they created, not NPCs created by the DM
- The `canAdd` logic changes: scribes always see the add button (they can always create NPCs, even if they already have a PC)

