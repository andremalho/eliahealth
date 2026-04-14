import api from './client';
import portalApi from './portalClient';

// ── Doctor-side API ──

export interface ConsultationSummary {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  summaryText: string;
  originalAiText: string | null;
  sourceData: {
    diagnoses: string[];
    prescriptions: string[];
    examsRequested: string[];
    orientations: string[];
    alerts: string[];
    gestationalAge?: string;
  } | null;
  status: string;
  deliveryChannel: string;
  approvedAt: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export async function generateSummary(consultationId: string): Promise<ConsultationSummary> {
  const { data } = await api.post(`/consultation-summaries/generate/${consultationId}`);
  return data;
}

export async function fetchSummariesByConsultation(consultationId: string): Promise<ConsultationSummary[]> {
  const { data } = await api.get(`/consultation-summaries/consultation/${consultationId}`);
  return data;
}

export async function approveSummary(
  summaryId: string,
  body: { summaryText?: string; deliveryChannel?: string },
): Promise<ConsultationSummary> {
  const { data } = await api.patch(`/consultation-summaries/${summaryId}/approve`, body);
  return data;
}

export async function sendSummary(summaryId: string): Promise<ConsultationSummary> {
  const { data } = await api.post(`/consultation-summaries/${summaryId}/send`);
  return data;
}

// ── Portal (patient-side) API ──

export async function fetchPortalConsultationSummaries(page = 1, limit = 20) {
  const { data } = await portalApi.get('/portal/consultation-summaries', {
    params: { page, limit },
  });
  return data;
}

export async function markSummaryAsRead(summaryId: string) {
  const { data } = await portalApi.patch(`/portal/consultation-summaries/${summaryId}/read`);
  return data;
}
