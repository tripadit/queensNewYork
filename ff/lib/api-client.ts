const BASE_URL = 'http://localhost:8000';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`API Error [${response.status}]: ${endpoint}`, errorText);
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    return response.json();
  } catch (e: any) {
    console.error(`Fetch failure: ${endpoint}`, e);
    throw e;
  }
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
  getStaffStats: (channel: string = 'stream1') => fetchApi(`/api/staff/stats?channel=${channel}`),
  getStaffLogs: () => fetchApi('/api/staff/logs'),
  getWeaponLogs: () => fetchApi('/api/weapon/logs'),
  getStaffProfiles: () => fetchApi('/api/staff/profiles'),
  getLoiteringStatus: () => fetchApi('/api/loitering/status'),
  getLoiteringLogs: () => fetchApi('/api/loitering/logs'),
  getLoiteringStats: () => fetchApi('/api/loitering/stats'),
  startLoitering: () => fetchApi('/api/loitering/start', { method: 'POST' }),
  stopLoitering: () => fetchApi('/api/loitering/stop', { method: 'POST' }),
  getLoiteringPolygon: (channelId: string = 'stream1') => fetchApi(`/api/loitering/polygon/${channelId}`),
  setLoiteringPolygon: (channelId: string, polygon: number[][]) => fetchApi(`/api/loitering/polygon/${channelId}`, {
    method: 'POST',
    body: JSON.stringify({ polygon }),
  }),
  getReportPdf: async () => {
    const res = await fetch(`${BASE_URL}/api/reports/pdf`);
    if (!res.ok) {
        const text = await res.text().catch(() => 'No error body');
        throw new Error(`PDF generation failed (${res.status}): ${text}`);
    }
    return res.blob();
  },
  registerStaff: (formData: FormData) => fetch(`${BASE_URL}/api/staff/register`, {
    method: 'POST',
    body: formData,
  }).then(res => {
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  }),
};

export const STREAM_URL = `${BASE_URL}/stream`;
