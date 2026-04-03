

## Plan: Fix Breadcrumb Navigation to Correct Tab

### Problem
The "Characters" and "Locations" breadcrumb links in CharacterSheet, NPCSheet, and LocationEditor all navigate to `/adventure/${adventureId}`, which always opens the default "entries" tab.

### Solution
Use a `tab` query parameter to control the active tab in AdventureDashboard, and update breadcrumb links to include it.

### Changes

**`src/pages/AdventureDashboard.tsx`**:
- Read `tab` from URL search params (`useSearchParams`)
- Use it as the `defaultValue` for `Tabs` (fallback to `"entries"`)
- Optionally sync tab changes back to the URL with `onValueChange`

**`src/pages/CharacterSheet.tsx`**:
- Change "Characters" breadcrumb href from `/adventure/${adventureId}` to `/adventure/${adventureId}?tab=characters`

**`src/pages/NPCSheet.tsx`**:
- Change "Characters" breadcrumb href from `/adventure/${adventureId}` to `/adventure/${adventureId}?tab=characters`

**`src/pages/LocationEditor.tsx`**:
- Change "Locations" breadcrumb href from `/adventure/${adventureId}` to `/adventure/${adventureId}?tab=locations`

**`src/pages/AdventureView.tsx`** (if it has similar breadcrumb/tab issues):
- Apply the same `tab` query param pattern for consistency

### Technical Details
- `useSearchParams` from react-router-dom reads the `?tab=` param
- `<Tabs defaultValue={searchParams.get('tab') || 'entries'}>` sets the initial tab
- Breadcrumb links use standard `<a href>` so the query param will work naturally

