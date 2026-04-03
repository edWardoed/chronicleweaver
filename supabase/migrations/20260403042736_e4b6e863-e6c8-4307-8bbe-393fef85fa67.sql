CREATE POLICY "Players and scribes can select adventure characters"
ON public.characters
FOR SELECT
TO authenticated
USING (
  get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
);