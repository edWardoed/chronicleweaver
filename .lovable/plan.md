

## Plan: Make Adventure Card Title Clickable

### What Changes
Make the entire adventure card body (image, title, description) clickable to navigate — edit dashboard for DM/scribe, read-only view for players. Keep the delete button separate.

### Changes

**`src/components/AdventureCard.tsx`**:
- Wrap the image + text content area (lines 28–51) in a clickable `<button>` or `<div>` with `onClick` that calls `onEdit` for DM/scribe or `onView` for players
- Add `cursor-pointer` styling to the clickable area
- Remove the separate View/Edit icon buttons (lines 53–61) since the card body now handles navigation
- Keep only the Delete button in the action column

### Technical Details
- Click handler: `showEditButton ? onEdit(adventure.id) : onView(adventure.id)`
- The card body becomes the click target; delete button remains in the right column with `group-hover` visibility

