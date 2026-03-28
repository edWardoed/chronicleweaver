
-- Add created_by column
ALTER TABLE public.characters ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Security definer function to check if user already has a PC in an adventure
CREATE OR REPLACE FUNCTION public.user_has_pc_in_adventure(_user_id uuid, _adventure_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.characters
    WHERE adventure_id = _adventure_id
      AND created_by = _user_id
      AND type = 'PC'
  )
$$;

-- Player/Scribe can INSERT one PC per adventure
CREATE POLICY "Player/Scribe can insert own PC"
ON public.characters
FOR INSERT
TO authenticated
WITH CHECK (
  type = 'PC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
  AND NOT user_has_pc_in_adventure(auth.uid(), adventure_id)
);

-- Player/Scribe can UPDATE their own PC
CREATE POLICY "Player/Scribe can update own PC"
ON public.characters
FOR UPDATE
TO authenticated
USING (
  type = 'PC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
)
WITH CHECK (
  type = 'PC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
);

-- Player/Scribe can DELETE their own PC
CREATE POLICY "Player/Scribe can delete own PC"
ON public.characters
FOR DELETE
TO authenticated
USING (
  type = 'PC'
  AND created_by = auth.uid()
  AND get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
);
