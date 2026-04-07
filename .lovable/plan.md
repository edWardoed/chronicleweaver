

## Add "Game System" Field to Adventure Creation

### Summary
Add a "Game System" dropdown to the Create Adventure modal. For now the only option is "D&D 5E", which will be pre-selected as the default. The value will be stored in a new `game_system` column on the `adventures` table.

### Changes

**1. Database migration** — Add `game_system` column to `adventures`:
```sql
ALTER TABLE public.adventures
  ADD COLUMN game_system text NOT NULL DEFAULT 'D&D 5E';
```
This backfills all existing adventures with "D&D 5E".

**2. `src/lib/types.ts`** — Add `game_system: string` to the `Adventure` interface.

**3. `src/components/CreateAdventureModal.tsx`**:
- Add a `game_system` field to the Zod schema with a default of `'D&D 5E'`
- Add a `Select` dropdown between Title and Description with "D&D 5E" as the single option
- Pass `game_system` through to the `createAdventure` mutation

**4. `src/hooks/useAdventures.ts`** — Add `game_system` to the `useCreateAdventure` mutation input type.

**5. `src/hooks/useAdventure.ts`** — No changes needed (already uses `select('*')`).

Single column addition, ~15 lines of UI code added.

