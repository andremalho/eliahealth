import api from './client';

export async function fetchAnalytics(from?: string, to?: string, doctorId?: string) {
  const { data } = await api.get('/analytics', { params: { from, to, doctorId } });
  return data;
}
