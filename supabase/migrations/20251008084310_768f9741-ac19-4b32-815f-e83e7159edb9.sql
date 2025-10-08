-- Create storage bucket for excel files
INSERT INTO storage.buckets (id, name) 
VALUES ('excel-files', 'excel-files')
ON CONFLICT (id) DO NOTHING;

-- Create policies for excel files bucket
CREATE POLICY "Anyone can upload excel files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'excel-files');

CREATE POLICY "Anyone can view excel files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'excel-files');

CREATE POLICY "Anyone can update excel files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'excel-files');

CREATE POLICY "Anyone can delete excel files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'excel-files');

-- Add storage_path column to asset_hierarchy to track original file location
ALTER TABLE public.asset_hierarchy 
ADD COLUMN IF NOT EXISTS storage_path TEXT;