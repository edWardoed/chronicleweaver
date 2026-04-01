

## Plan: Custom Location Types per Adventure

Allow DMs/Admins to manage a custom list of location types for each adventure via the Settings tab.

### Approach
Store custom location types as a JSON array column on the `adventures` table. The default hardcoded list serves as the initial value. DMs can add/remove types in Settings. The LocationList and LocationEditor components read from this column instead of the hardcoded array.

### Changes

1. **Database migration** — Add a `location_types` column to the `adventures` table:
   ```sql
   ALTER TABLE adventures ADD COLUMN location_types text[] 
     DEFAULT ARRAY['City','Town','Village','Dungeon','Ruins','Wilderness','Building','Landmark','Region','Other'];
   ```

2. **`src/lib/types.ts`** — Add `location_types: string[] | null` to the `Adventure` interface.

3. **`src/pages/AdventureDashboard.tsx`** — Add a "Location Types" section in the Settings tab:
   - Display current types as removable badges (with X button)
   - Input field + "Add" button to add a new custom type
   - Calls `updateAdventure.mutate()` to persist changes
   - "Other" type cannot be removed (always kept as fallback)

4. **`src/components/LocationList.tsx`** — Accept `locationTypes` prop from parent, or fetch adventure data to get custom types. Use `adventure.location_types` instead of hardcoded `LOCATION_TYPES` in the "Add Location" modal.

5. **`src/pages/LocationEditor.tsx`** — Fetch adventure data (already does via `useAdventure`) and use `adventure.location_types` for the type dropdown instead of the hardcoded constant.

### Technical Details
- The hardcoded `LOCATION_TYPES` array becomes the default fallback when `adventure.location_types` is null (for existing adventures)
- Both LocationList and LocationEditor already have access to `adventureId` and can use `useAdventure` to get the custom types
- Only DM/Admin can see the Settings tab, so only they can modify types

