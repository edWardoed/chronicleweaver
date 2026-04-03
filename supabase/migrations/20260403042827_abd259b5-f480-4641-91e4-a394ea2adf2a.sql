-- Allow players/scribes to SELECT locations in their adventure
CREATE POLICY "Players and scribes can select adventure locations"
ON public.locations
FOR SELECT
TO authenticated
USING (
  get_adventure_role(auth.uid(), adventure_id) IN ('player', 'scribe')
);

-- Add UPDATE policy on adventure-images storage bucket
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'adventure-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);