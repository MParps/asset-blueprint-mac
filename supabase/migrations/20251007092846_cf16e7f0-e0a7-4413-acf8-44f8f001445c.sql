-- Create table for storing sheet images
CREATE TABLE public.sheet_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.asset_sheets(id) ON DELETE CASCADE,
  image_data TEXT NOT NULL,
  image_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sheet_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view sheet images"
ON public.sheet_images
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert sheet images"
ON public.sheet_images
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sheet images"
ON public.sheet_images
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete sheet images"
ON public.sheet_images
FOR DELETE
USING (true);