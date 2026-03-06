const BASE_URL = 'http://localhost:8000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getPeople: () => fetchApi('/api/people'),
  getVisits: () => fetchApi('/api/visits'),
  getAnalyticsSummary: () => fetchApi('/api/analytics/summary'),
  getHourlyFlow: () => fetchApi('/api/analytics/hourly_flow'),
  getRecentVisits: () => fetchApi('/api/analytics/recent_visits'),
  getCustomerStats: () => fetchApi('/api/analytics/customer_stats'),
  getGenderAgeDistribution: () => fetchApi('/api/analytics/gender_age_distribution'),
  getTopCustomers: () => fetchApi('/api/analytics/top_customers'),
  getVisitDurationDistribution: () => fetchApi('/api/analytics/visit_duration_distribution'),
  getStaffStats: () => fetchApi('/api/staff/stats'),
  getStaffLogs: () => fetchApi('/api/staff/logs'),
  getWeaponLogs: () => fetchApi('/api/weapon/logs'),
  getStaffProfiles: () => fetchApi('/api/staff/profiles'),
  getLoiteringStatus: () => fetchApi('/api/loitering/status'),
  getLoiteringLogs: () => fetchApi('/api/loitering/logs'),
  getLoiteringStats: () => fetchApi('/api/loitering/stats'),
  startLoitering: () => fetchApi('/api/loitering/start', { method: 'POST' }),
  stopLoitering: () => fetchApi('/api/loitering/stop', { method: 'POST' }),
  getLoiteringPolygon: () => fetch('http://localhost:8001/api/polygon').then(res => res.json()),
  setLoiteringPolygon: (polygon: number[][]) => fetch('http://localhost:8001/api/polygon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon }),
  }).then(res => res.json()),
  registerStaff: (formData: FormData) => fetch(`${BASE_URL}/api/staff/register`, {
    method: 'POST',
    body: formData,
  }).then(res => {
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  }),
};

export const STREAM_URL = `${BASE_URL}/stream`;
