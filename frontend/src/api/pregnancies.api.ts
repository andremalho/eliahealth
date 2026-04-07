import api from './client';

export interface Pregnancy {
  id: string;
  patientId: string;
  patientName?: string;
  lmpDate: string;
  edd: string;
  gaMethod: string;
  status: string;
  isHighRisk: boolean;
  highRiskFlags: string[];
  gestationalAge?: { weeks: number; days: number };
  riskLevel?: string;
}

export interface PregnancyListItem {
  id: string;
  patientId: string;
  patientName: string;
  gestationalAge: { weeks: number; days: number };
  edd: string;
  status: string;
  riskLevel: string;
  highRiskFlags: string[];
}

export async function fetchPregnancyList(params?: {
  status?: string;
  sort?: string;
  search?: string;
}) {
  const { data } = await api.get<PregnancyListItem[]>('/pregnancies/list', { params });
  return data;
}

export async function fetchUpcomingBirths(days = 30) {
  const { data } = await api.get('/birth-calendar/upcoming', { params: { days } });
  return data;
}

export async function createPregnancy(patientId: string, dto: {
  lmpDate: string;
  gaMethod: string;
  gravida: number;
  para: number;
  abortus: number;
}) {
  const { data } = await api.post(`/patients/${patientId}/pregnancies`, dto);
  return data;
}

export async function quickCreatePregnancy(dto: Record<string, unknown>) {
  const { data } = await api.post('/pregnancies/quick-create', dto);
  return data;
}
