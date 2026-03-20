ALTER TABLE public.entry_characters
  DROP CONSTRAINT entry_characters_character_id_fkey,
  ADD CONSTRAINT entry_characters_character_id_fkey
    FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;

ALTER TABLE public.entry_characters
  DROP CONSTRAINT entry_characters_entry_id_fkey,
  ADD CONSTRAINT entry_characters_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES public.entries(id) ON DELETE CASCADE;

ALTER TABLE public.entry_locations
  DROP CONSTRAINT entry_locations_location_id_fkey,
  ADD CONSTRAINT entry_locations_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.entry_locations
  DROP CONSTRAINT entry_locations_entry_id_fkey,
  ADD CONSTRAINT entry_locations_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES public.entries(id) ON DELETE CASCADE;