

## Plan: Make Entry and Location Cards Fully Clickable

Make the entire card body clickable to open the item, while keeping the delete button separate. Similar to what was done for AdventureCard.

### Changes

**`src/components/EntryCard.tsx`**:
- Make the outer card div clickable with `cursor-pointer` and `onClick={onEdit}`
- When `readOnly` and no `onEdit`, clicking does nothing (or could navigate to view — currently no view route for entries)
- Remove the separate Edit (Pencil) icon button
- Keep the Delete button, stop its click from propagating to the card

**`src/components/LocationList.tsx` (LocationCard function)**:
- Make the card div clickable with `cursor-pointer` and `onClick={onEdit}`
- For read-only mode, pass an `onEdit` that navigates to the location page (view route) so players can click to view
- Remove the separate Edit (Pencil) icon button
- Keep the Delete button with `e.stopPropagation()`
- In the parent `LocationList`, always pass `onEdit` for navigation (even in readOnly mode) so clicking opens the location

**`src/pages/AdventureView.tsx`**:
- Pass `onEdit` to `EntryCard` even in read-only mode so clicking navigates to view the entry (route: `/adventure/${adventureId}/entry/${entry.id}`)
- Pass navigation handler to `LocationList` — already handled since LocationList manages its own navigation internally; just need to ensure readOnly locations are also clickable

### Technical Details
- `e.stopPropagation()` on delete buttons prevents card click from firing
- Add `cursor-pointer` to card containers
- Remove `Pencil` icon buttons from both components since the whole card replaces that function

