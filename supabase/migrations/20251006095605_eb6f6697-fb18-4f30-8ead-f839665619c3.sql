-- Create asset hierarchy table to store folder structure
CREATE TABLE IF NOT EXISTS public.asset_hierarchy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.asset_hierarchy(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create BOM items table
CREATE TABLE IF NOT EXISTS public.bom_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.asset_hierarchy(id) ON DELETE CASCADE,
  item_no TEXT,
  description TEXT,
  details TEXT,
  manufacturer TEXT,
  part_number TEXT,
  item_code TEXT,
  uom TEXT,
  sys_qty NUMERIC,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_hierarchy_parent ON public.asset_hierarchy(parent_id);
CREATE INDEX IF NOT EXISTS idx_asset_hierarchy_path ON public.asset_hierarchy(path);
CREATE INDEX IF NOT EXISTS idx_bom_items_asset ON public.bom_items(asset_id);

-- Enable RLS (making it public for now since no auth required)
ALTER TABLE public.asset_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to asset_hierarchy"
  ON public.asset_hierarchy FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to asset_hierarchy"
  ON public.asset_hierarchy FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to asset_hierarchy"
  ON public.asset_hierarchy FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete from asset_hierarchy"
  ON public.asset_hierarchy FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to bom_items"
  ON public.bom_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to bom_items"
  ON public.bom_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to bom_items"
  ON public.bom_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete from bom_items"
  ON public.bom_items FOR DELETE
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_asset_hierarchy_updated_at
  BEFORE UPDATE ON public.asset_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bom_items_updated_at
  BEFORE UPDATE ON public.bom_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();