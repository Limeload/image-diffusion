-- Run this in the Supabase SQL editor AFTER creating the bucket named
-- "generated-images" in the Supabase dashboard (Storage → New bucket).

-- Public read: anyone can view images
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-images');

-- Authenticated write: only signed-in users can upload
CREATE POLICY "Authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-images');

-- Owners can delete their own uploads
CREATE POLICY "Owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
