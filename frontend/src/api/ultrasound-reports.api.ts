import api from './client';

export interface UltrasoundReportItem {
  id: string;
  patientId: string;
  pregnancyId: string | null;
  templateId: string;
  category: string;
  reportDate: string;
  data: Record<string, unknown>;
  status: 'draft' | 'pending_signature' | 'signed' | 'exported';
  conclusion: string | null;
  images: { url: string; filename: string; order: number }[];
  signedAt: string | null;
  signedByName: string | null;
  signedByCrm: string | null;
  doctor?: { name: string; crm: string };
  patient?: { fullName: string };
}

export const createReport = async (dto: {
  patientId: string;
  pregnancyId?: string;
  templateId: string;
  category: string;
  reportDate: string;
  data: Record<string, unknown>;
  conclusion?: string;
}) => (await api.post('/ultrasound-reports', dto)).data;

export const fetchReportsByPatient = async (patientId: string) =>
  (await api.get(`/ultrasound-reports/patient/${patientId}`)).data as UltrasoundReportItem[];

export const fetchReportsByPregnancy = async (pregnancyId: string) =>
  (await api.get(`/ultrasound-reports/pregnancy/${pregnancyId}`)).data as UltrasoundReportItem[];

export const fetchReport = async (id: string) =>
  (await api.get(`/ultrasound-reports/${id}`)).data as UltrasoundReportItem;

export const updateReport = async (id: string, dto: Record<string, unknown>) =>
  (await api.patch(`/ultrasound-reports/${id}`, dto)).data;

export const signReport = async (id: string, doctorName: string, doctorCrm: string) =>
  (await api.post(`/ultrasound-reports/${id}/sign`, { doctorName, doctorCrm })).data;

export const exportReport = async (id: string, format: string) =>
  (await api.post(`/ultrasound-reports/${id}/export`, { format })).data;

export const sendReport = async (id: string, via: string, to: string) =>
  (await api.post(`/ultrasound-reports/${id}/send`, { via, to })).data;

export const deleteReport = async (id: string) =>
  (await api.delete(`/ultrasound-reports/${id}`)).data;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending_signature: 'Aguardando assinatura',
  signed: 'Assinado',
  exported: 'Exportado',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_signature: 'bg-amber-100 text-amber-700',
  signed: 'bg-emerald-100 text-emerald-700',
  exported: 'bg-blue-100 text-blue-700',
};
