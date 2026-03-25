

## Plan: Add "Real World" Date Field with Calendar Picker

### Summary
Add a "Real World" date picker field above the existing "Session Date" section in the right sidebar of the Entry Editor. It will use the Shadcn Calendar + Popover pattern with a CalendarIcon button.

### Database
- Add a `real_world_date` column (type `date`, nullable) to the `entries` table via migration.

### Code Changes

**1. `src/pages/EntryEditor.tsx`**
- Add state: `const [realWorldDate, setRealWorldDate] = useState<Date | undefined>()`
- Import `Calendar`, `Popover`, `PopoverTrigger`, `PopoverContent` from shadcn, plus `format` from `date-fns` and `CalendarIcon` from lucide-react.
- Populate `realWorldDate` from `existingEntry.real_world_date` in the existing `useEffect`.
- Include `real_world_date` in the `handleSave` payload and autosave payload (format as `yyyy-MM-dd` string).
- In `rightSidebarContent`, add a "Real World" section above the "Session Date" heading:
  ```
  <h3>Real World</h3>
  <Popover>
    <PopoverTrigger> button showing formatted date or "Pick a date" </PopoverTrigger>
    <PopoverContent>
      <Calendar mode="single" selected={realWorldDate} onSelect={setRealWorldDate} className="pointer-events-auto" />
    </PopoverContent>
  </Popover>
  ```

**2. `src/hooks/useEntries.ts`**
- Add `real_world_date` to the create and update mutation payloads.

**3. `src/lib/types.ts`**
- Add `real_world_date: string | null` to the `Entry` interface.

**4. Database migration**
```sql
ALTER TABLE public.entries ADD COLUMN real_world_date date;
```

### Styling
- Matches existing right sidebar pattern (xs text, muted-foreground heading, bg-muted button).
- Calendar styled via shadcn defaults which already fit the dark theme.

