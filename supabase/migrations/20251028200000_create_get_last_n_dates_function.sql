/*
  # Create get_last_n_dates Function

  ## Purpose
  This migration creates a database function to retrieve the last N distinct dates from the grain_entries table.
  This function is used by pricing analytics to get the last 30 dates (not days) that have grain entries.

  ## Changes
  1. New Function
    - `get_last_n_dates(n integer)` - Returns the last N unique dates from grain_entries table
      - Returns array of date strings in descending order (newest first)
      - Filters only active entries (is_active = true)
      - Uses SECURITY DEFINER to work with RLS policies
      - Takes parameter n to specify how many dates to return

  ## Security
  - Function uses SECURITY DEFINER to allow authenticated users to query dates
  - Only returns dates from active grain entries
  - No sensitive data exposed (only dates)
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_last_n_dates(integer);

-- Create function to get last N distinct dates from grain_entries
CREATE OR REPLACE FUNCTION public.get_last_n_dates(n integer DEFAULT 30)
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT date::text
  FROM public.grain_entries
  WHERE is_active = true
  ORDER BY date DESC
  LIMIT n;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_last_n_dates(integer) TO authenticated;
