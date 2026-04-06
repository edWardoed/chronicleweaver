

## Replace Character & Location Search with Searchable Dropdown Popover

### Problem
The current character and location pickers in the entry sidebar use a plain text input that shows a results list only while typing. This is not a standard dropdown pattern and requires users to know what to search for.

### Changes

**`src/pages/EntryEditor.tsx`** — Replace both the character and location "Add" sections (lines 200-225 and 253-278) with a `Popover`-based searchable dropdown:

- Replace the `<Input>` + conditional results div with a `Popover` containing:
  - A trigger `Button` styled like the existing input ("Add character…" / "Add location…")
  - Inside the popover: a search `Input` at top, then a scrollable list of unlinked items filtered by the search term
  - Clicking an item links it and closes the popover
- Remove `charSearch` and `locSearch` state variables (replace with local state inside each popover or keep and reset on close)
- Show all available (unlinked) items when the popover opens with no search text, so users can browse the full list
- Keep the existing linked chips display and the X-to-unlink behavior unchanged

### UI Pattern
```text
┌─────────────────────┐
│ + Add character… ▾  │  ← Button trigger
└─────────────────────┘
┌─────────────────────┐
│ 🔍 Search…          │  ← Input inside popover
├─────────────────────┤
│ Aragorn (PC)        │  ← Filtered results
│ Gandalf (NPC)       │
│ Legolas (PC)        │
└─────────────────────┘
```

Single file change, ~60 lines modified.

