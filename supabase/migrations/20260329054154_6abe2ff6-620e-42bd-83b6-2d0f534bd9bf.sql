
-- Scribe can insert NPCs (no limit, must set created_by to self)
CREATE POLICY "Scribe can insert own NPC"
ON public.characters
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'NPC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) = 'scribe'
);

-- Scribe can update NPCs they created
CREATE POLICY "Scribe can update own NPC"
ON public.characters
FOR UPDATE
TO authenticated
USING (
  type = 'NPC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) = 'scribe'
)
WITH CHECK (
  type = 'NPC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) = 'scribe'
);

-- Scribe can delete NPCs they created
CREATE POLICY "Scribe can delete own NPC"
ON public.characters
FOR DELETE
TO authenticated
USING (
  type = 'NPC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) = 'scribe'
);
