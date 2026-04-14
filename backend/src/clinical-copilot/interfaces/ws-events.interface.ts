import { TriggerEvent } from '../enums/trigger-event.enum.js';
import { CopilotInsight } from '../entities/copilot-insight.entity.js';

export interface WsFieldUpdatePayload {
  trigger: TriggerEvent;
  field: string;
  value: unknown;
  currentFormState: Record<string, unknown>;
}

export interface WsInsightsPayload {
  trigger: string;
  insights: CopilotInsight[];
  timestamp: string;
}

export interface WsInsightActionPayload {
  insightId: string;
  action: 'accepted' | 'dismissed';
  note?: string;
}

export interface SessionContext {
  consultationId: string;
  patientId: string;
  tenantId: string | null;
  doctorId: string;
  currentFormState: Record<string, unknown>;
  patientProfile: Record<string, unknown> | null;
  recentHistory: Record<string, unknown>[];
  labResults: Record<string, unknown>[];
  currentMedications: Record<string, unknown>[];
  vaccineStatus: Record<string, unknown>[];
  previousInsights: string[];
  connectedAt: Date;
}
