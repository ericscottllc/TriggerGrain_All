import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNotifications } from '../../../contexts/NotificationContext';

interface UseDataFetchOptions {
  tableName: string;
  select?: string;
  orderBy?: { column: string; ascending: boolean };
  errorMessage?: string;
}

export function useDataFetch<T>(options: UseDataFetchOptions) {
  const { tableName, select = '*', orderBy, errorMessage = 'Failed to load data' } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useNotifications();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from(tableName).select(select);

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData(fetchedData || []);
    } catch (err) {
      console.error(`Error fetching data from ${tableName}:`, err);
      error(errorMessage, err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tableName, select, orderBy?.column, orderBy?.ascending, error, errorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData, setData };
}
