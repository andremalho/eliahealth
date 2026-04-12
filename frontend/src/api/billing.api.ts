import api from './client';

export const createBillingRecord = async (dto: Record<string, unknown>) =>
  (await api.post('/billing', dto)).data;

export const fetchBillingRecords = async (status?: string, page = 1) =>
  (await api.get('/billing', { params: { status, page } })).data;

export const fetchBillingSummary = async () =>
  (await api.get('/billing/summary')).data;

export const fetchPatientBilling = async (patientId: string) =>
  (await api.get(`/billing/patient/${patientId}`)).data;

export const fetchBillingRecord = async (id: string) =>
  (await api.get(`/billing/${id}`)).data;

export const updateBillingRecord = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/billing/${id}`, dto)).data;

export const submitBilling = async (id: string) =>
  (await api.post(`/billing/${id}/submit`)).data;

export const markBillingPaid = async (id: string, paidValue: number) =>
  (await api.post(`/billing/${id}/paid`, { paidValue })).data;

export const denyBilling = async (id: string, reason: string) =>
  (await api.post(`/billing/${id}/deny`, { reason })).data;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', submitted: 'Enviada', approved: 'Aprovada',
  denied: 'Glosada', appealed: 'Recurso', paid: 'Paga',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-emerald-50 text-emerald-700', denied: 'bg-red-50 text-red-700',
  appealed: 'bg-amber-50 text-amber-700', paid: 'bg-emerald-100 text-emerald-800',
};
