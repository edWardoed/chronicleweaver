
-- Drop permissive unauthenticated storage policies
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- Restrict uploads to authenticated users only
CREATE POLICY "Auth upload access" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'adventure-images');

-- Restrict deletes to authenticated users only
CREATE POLICY "Auth delete access" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'adventure-images');
