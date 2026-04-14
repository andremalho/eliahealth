import api from './client';

export async function fetchCopilotDashboard() {
  const { data } = await api.get('/copilot-dashboard');
  return data;
}
