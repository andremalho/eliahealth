import api from './client';

export const fetchResearchStats = async () =>
  (await api.get('/research/stats')).data;

export const fetchResearchOverview = async () =>
  (await api.get('/research/stats/overview')).data;

export const fetchResearchRecords = async (filters?: Record<string, string>) =>
  (await api.get('/research/records', { params: filters })).data;

export const queryResearch = async (question: string) =>
  (await api.post('/research/query', { question })).data as {
    sql?: string;
    data?: any[];
    chartType?: string;
    explanation?: string;
    error?: string;
  };

export const fetchQueryHistory = async () =>
  (await api.get('/research/query/history')).data;

export const INCOME_LABELS: Record<string, string> = {
  A: 'Classe A (>15 SM)',
  B: 'Classe B (5-15 SM)',
  C: 'Classe C (3-5 SM)',
  D: 'Classe D (1-3 SM)',
  E: 'Classe E (<1 SM)',
};

export const INCOME_COLORS: Record<string, string> = {
  A: '#6366f1',
  B: '#8b5cf6',
  C: '#a78bfa',
  D: '#c4b5fd',
  E: '#ddd6fe',
};

export const AGE_GROUP_LABELS: Record<string, string> = {
  '15_19': '15-19',
  '20_24': '20-24',
  '25_29': '25-29',
  '30_34': '30-34',
  '35_39': '35-39',
  '40_plus': '40+',
};
