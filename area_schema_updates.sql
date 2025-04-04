CREATE SQL SCRIPT FOR AREA ASSIGNMENT

-- Add area column to users table if it doesn't exist
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS area TEXT;

-- Add default area values for existing officers
UPDATE public.users SET area = 'unassigned' WHERE role = 'officer' AND (area IS NULL OR area = '');

-- Create an index on the area column for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_area ON public.users (area);

-- Create officers if they don't exist
INSERT INTO public.users (clerk_id, email, first_name, last_name, role, area)
VALUES
  ('officer1', 'officer1@example.com', 'Officer', 'One', 'officer', 'bopal')
ON CONFLICT (clerk_id) DO NOTHING;

INSERT INTO public.users (clerk_id, email, first_name, last_name, role, area)
VALUES
  ('officer2', 'officer2@example.com', 'Officer', 'Two', 'officer', 'south bopal')
ON CONFLICT (clerk_id) DO NOTHING;
