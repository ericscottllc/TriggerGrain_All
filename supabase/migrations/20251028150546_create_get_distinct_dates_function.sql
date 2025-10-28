/*
  # Create get_distinct_dates Function

  ## Purpose
  This migration creates a database function to retrieve all distinct dates from the grain_entries table.
  This function is used by the One Pager page to populate the date selection dropdown.

  ## Changes
  1. New Function
    - `get_distinct_dates()` - Returns all unique dates from grain_entries table
      - Returns array of date strings
      - Filters only active entries (is_active = true)
      - Orders dates in descending order (newest first)
      - Uses SECURITY DEFINER to work with RLS policies

  ## Security
  - Function uses SECURITY DEFINER to allow authenticated users to query dates
  - Only returns dates from active grain entries
  - No sensitive data exposed (only dates)
*/

-- Create function to get distinct dates from grain_entries
CREATE OR REPLACE FUNCTION public.get_distinct_dates()
RETURNS TABLE (date date)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ge.date
  FROM grain_entries ge
  WHERE ge.is_active = true
  ORDER BY ge.date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_distinct_dates() TO authenticated;
