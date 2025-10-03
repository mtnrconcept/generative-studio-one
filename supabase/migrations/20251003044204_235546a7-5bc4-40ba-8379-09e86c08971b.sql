-- Create table for Kenney asset packs catalog
CREATE TABLE IF NOT EXISTS public.kenney_asset_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  download_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size TEXT,
  tags TEXT[] DEFAULT '{}',
  is_downloaded BOOLEAN DEFAULT false,
  local_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX idx_kenney_packs_category ON public.kenney_asset_packs(category);
CREATE INDEX idx_kenney_packs_tags ON public.kenney_asset_packs USING GIN(tags);
CREATE INDEX idx_kenney_packs_slug ON public.kenney_asset_packs(slug);

-- Enable RLS
ALTER TABLE public.kenney_asset_packs ENABLE ROW LEVEL SECURITY;

-- Everyone can read asset packs
CREATE POLICY "Asset packs are viewable by everyone"
  ON public.kenney_asset_packs
  FOR SELECT
  USING (true);

-- Create table for user's favorite/downloaded packs
CREATE TABLE IF NOT EXISTS public.user_asset_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pack_id UUID REFERENCES public.kenney_asset_packs(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, pack_id)
);

-- Enable RLS
ALTER TABLE public.user_asset_packs ENABLE ROW LEVEL SECURITY;

-- Users can view their own asset packs
CREATE POLICY "Users can view their own asset packs"
  ON public.user_asset_packs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own asset packs
CREATE POLICY "Users can insert their own asset packs"
  ON public.user_asset_packs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own asset packs
CREATE POLICY "Users can update their own asset packs"
  ON public.user_asset_packs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own asset packs
CREATE POLICY "Users can delete their own asset packs"
  ON public.user_asset_packs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_kenney_packs_updated_at
  BEFORE UPDATE ON public.kenney_asset_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();