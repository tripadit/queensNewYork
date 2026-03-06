import { useState, useEffect, useCallback } from 'react';

const useApi = (apiFunc) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunc();
      const cleanedData = Array.isArray(response.data) 
        ? response.data.filter(item => item && typeof item === 'object')
        : response.data;
      setData(cleanedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
};

export default useApi;
