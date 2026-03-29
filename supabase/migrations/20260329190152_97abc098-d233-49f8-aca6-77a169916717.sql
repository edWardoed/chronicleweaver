
-- Replace storage policies to scope uploads/deletes to user's folder
DROP POLICY IF EXISTS "Auth upload access" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete access" ON storage.objects;

-- Users can only upload to their own folder
CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'adventure-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete files in their own folder
CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'adventure-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
