import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // Adjust the baseURL to your backend's address
});

export const getPeople = () => apiClient.get('/api/people');
export const updatePersonName = (personId, name) => apiClient.put(`/api/people/${personId}`, null, { params: { name } });
export const getVisits = () => apiClient.get('/api/visits');
export const getDailyAnalytics = () => apiClient.get('/api/daily_analytics');
export const getAnalyticsSummary = () => apiClient.get('/api/analytics/summary');
export const getHourlyFlow = () => apiClient.get('/api/analytics/hourly_flow');
export const getRecentVisits = () => apiClient.get('/api/analytics/recent_visits');
export const getCustomerStats = () => apiClient.get('/api/analytics/customer_stats');
export const getGenderAgeDistribution = () => apiClient.get('/api/analytics/gender_age_distribution');
export const getTopCustomers = () => apiClient.get('/api/analytics/top_customers');
export const getVisitDurationDistribution = () => apiClient.get('/api/analytics/visit_duration_distribution');

export const getStaffStats = () => apiClient.get('/api/staff/stats');
export const getStaffLogs = () => apiClient.get('/api/staff/logs');
export const registerStaff = (formData) => apiClient.post('/api/staff/register', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Loitering Microservice Control
export const startLoitering = () => apiClient.post('/api/loitering/start');
export const stopLoitering = () => apiClient.post('/api/loitering/stop');
export const getLoiteringStatus = () => apiClient.get('/api/loitering/status');
export const getLoiteringLogs = () => apiClient.get('/api/loitering/logs');
export const getLoiteringStats = () => apiClient.get('/api/loitering/stats');

// Direct calls to Microservice (Port 8001)
export const setLoiteringPolygon = (polygon) => axios.post('http://localhost:8001/api/polygon', { polygon });
export const getLoiteringPolygon = () => axios.get('http://localhost:8001/api/polygon');
