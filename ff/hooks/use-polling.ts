import { useState, useEffect, useCallback, useRef } from 'react';

export function usePolling<T>(fetcher: () => Promise<T>, interval: number = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch

    const timer = setInterval(() => {
      fetchData();
    }, interval);

    return () => clearInterval(timer);
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
}
