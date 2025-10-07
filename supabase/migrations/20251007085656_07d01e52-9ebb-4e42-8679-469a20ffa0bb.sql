-- Add metadata columns to asset_hierarchy
ALTER TABLE public.asset_hierarchy
ADD COLUMN assembly_name TEXT,
ADD COLUMN assembly_manufacturer TEXT,
ADD COLUMN description TEXT,
ADD COLUMN system TEXT,
ADD COLUMN rebuild_item TEXT,
ADD COLUMN asset_number TEXT,
ADD COLUMN approval_date TEXT,
ADD COLUMN total_cost DECIMAL;

-- Create table for storing multiple sheets per asset
CREATE TABLE public.asset_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.asset_hierarchy(id) ON DELETE CASCADE,
  sheet_name TEXT NOT NULL,
  sheet_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view asset sheets"
ON public.asset_sheets
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert asset sheets"
ON public.asset_sheets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update asset sheets"
ON public.asset_sheets
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete asset sheets"
ON public.asset_sheets
FOR DELETE
USING (true);

-- Add ON DELETE CASCADE to bom_items
ALTER TABLE public.bom_items
DROP CONSTRAINT IF EXISTS bom_items_asset_id_fkey,
ADD CONSTRAINT bom_items_asset_id_fkey 
  FOREIGN KEY (asset_id) 
  REFERENCES public.asset_hierarchy(id) 
  ON DELETE CASCADE;

-- Add sheet_id to bom_items to link items to specific sheets
ALTER TABLE public.bom_items
ADD COLUMN sheet_id UUID REFERENCES public.asset_sheets(id) ON DELETE CASCADE;