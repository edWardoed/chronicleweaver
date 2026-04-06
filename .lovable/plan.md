

## Fix Date Field Display in Entry Editor

### Problem
When a date is selected in the "Real World" date picker (right sidebar), the calendar icon stays visible, and the formatted date text can overflow the button.

### Changes

**`src/pages/EntryEditor.tsx`** (lines 288-298):
- Remove the `CalendarIcon` when `realWorldDate` is set (only show it for the placeholder state)
- Add `truncate` and `overflow-hidden` classes to the button so text stays within bounds
- Use a shorter date format (e.g. `"PP"` instead of `"PPP"`) to reduce text length in the narrow 180px sidebar

Updated button:
```tsx
<Button
  variant="outline"
  className={cn(
    "w-full justify-start text-left font-normal h-8 text-xs bg-muted border-border mb-4 overflow-hidden",
    !realWorldDate && "text-muted-foreground"
  )}
>
  {realWorldDate ? (
    <span className="truncate">{format(realWorldDate, "PP")}</span>
  ) : (
    <>
      <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
      <span>Pick a date</span>
    </>
  )}
</Button>
```

Single file, ~10 lines changed.

