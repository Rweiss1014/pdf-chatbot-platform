-- SmartDoc v3 Migration: Views column + increment_views function
-- Run this in the Supabase SQL Editor

-- Add views column to guides (if not already present)
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- Create the increment_views function (atomic counter)
CREATE OR REPLACE FUNCTION public.increment_views(guide_slug text)
RETURNS void AS $$
BEGIN
  UPDATE public.guides
  SET views = COALESCE(views, 0) + 1
  WHERE slug = guide_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
