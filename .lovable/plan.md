

## Plan: Make Footer Bar Sticky on Character & Location Pages

Both `CharacterSheet.tsx` and `LocationEditor.tsx` use a `min-h-screen flex flex-col` layout with a scrollable content area and a `<footer>`. The footer scrolls off-screen on long forms. Fix: make the footer stick to the bottom of the viewport.

### Changes

1. **`src/pages/CharacterSheet.tsx`** (line ~586) — Add `sticky bottom-0 z-10 bg-background` to the footer element so it stays visible while the form scrolls.

2. **`src/pages/LocationEditor.tsx`** (line ~253) — Same change: add `sticky bottom-0 z-10 bg-background` to the footer element.

No other files affected.

