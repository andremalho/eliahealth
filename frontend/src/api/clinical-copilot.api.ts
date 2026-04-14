import api from './client';

export interface CopilotCheckItem {
  id: string;
  severity: 'ok' | 'attention' | 'action_required';
  category: string;
  title: string;
  description: string;
  suggestedAction: string | null;
  guidelineReference: string | null;
  resolution: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  displayOrder: number;
}

export interface CopilotCheck {
  id: string;
  consultationId: string;
  clinicalContext: string;
  items: CopilotCheckItem[];
  totalItems: number;
  actionRequiredCount: number;
  attentionCount: number;
  okCount: number;
  reviewedByDoctor: boolean;
  reviewedAt: string | null;
  generationTimeMs: number | null;
  createdAt: string;
}

export async function generatePostConsultationCheck(consultationId: string): Promise<CopilotCheck> {
  const { data } = await api.post(`/copilot/post-consultation-check/${consultationId}`);
  return data;
}

export async function getCheckByConsultation(consultationId: string): Promise<CopilotCheck | null> {
  const { data } = await api.get(`/copilot/check/${consultationId}`);
  return data;
}

export async function resolveCheckItem(
  itemId: string,
  body: { resolution: string; resolutionNote?: string },
): Promise<CopilotCheckItem> {
  const { data } = await api.patch(`/copilot/check-item/${itemId}/resolve`, body);
  return data;
}

export async function markCheckAsReviewed(checkId: string): Promise<CopilotCheck> {
  const { data } = await api.patch(`/copilot/check/${checkId}/reviewed`);
  return data;
}

export async function getCopilotStats(from?: string, to?: string) {
  const { data } = await api.get('/copilot/stats', { params: { from, to } });
  return data;
}
