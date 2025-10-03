-- Fix security warning: Set search_path for function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_kenney_packs_updated_at
  BEFORE UPDATE ON public.kenney_asset_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();