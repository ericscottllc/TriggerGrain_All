/*
  # Fix get_distinct_dates Function Return Type

  ## Issue
  The get_distinct_dates function was returning TABLE(date date) but should return SETOF text
  to match the expected format and avoid parsing issues.

  ## Changes
  - Drop and recreate get_distinct_dates function
  - Change return type from TABLE(date date) to SETOF text
  - Cast date to text in the query for consistent string output
  - This ensures the function returns a flat array of date strings

  ## Security
  - Maintains SECURITY DEFINER for RLS compatibility
  - Grants execute to authenticated users
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_distinct_dates();

-- Recreate function with correct return type
CREATE OR REPLACE FUNCTION public.get_distinct_dates()
RETURNS SETOF text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT date::text
  FROM public.grain_entries
  WHERE is_active = true
  ORDER BY date DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_distinct_dates() TO authenticated;
