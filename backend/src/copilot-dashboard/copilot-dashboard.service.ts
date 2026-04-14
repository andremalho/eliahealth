import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CopilotDashboardService {
  private readonly logger = new Logger(CopilotDashboardService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getDashboardData(doctorId: string, tenantId: string | null) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const todayStr = now.toISOString().split('T')[0];

    const tenantFilter = tenantId ? `AND tenant_id = '${tenantId}'` : '';
    const tenantFilterCS = tenantId ? `AND cs.tenant_id = '${tenantId}'` : '';

    const [
      pendingSummaries,
      unreviewedChecklists,
      insightStats,
      longitudinalAlerts,
      escalatedChats,
      chatStats,
      copilotCheckStats,
    ] = await Promise.all([
      // 1. Resumos em draft
      this.dataSource.query(
        `SELECT cs.id, cs.status, cs.created_at, p.full_name AS patient_name
         FROM consultation_summaries cs
         JOIN patients p ON p.id = cs.patient_id
         WHERE cs.doctor_id = $1 ${tenantFilterCS} AND cs.status = 'draft'
         ORDER BY cs.created_at DESC LIMIT 10`,
        [doctorId],
      ),

      // 2. Checklists nao revisados
      this.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM copilot_checks
         WHERE doctor_id = $1 ${tenantFilter} AND reviewed_by_doctor = false`,
        [doctorId],
      ),

      // 3. Insights ultimos 7 dias
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(CASE WHEN doctor_action = 'accepted' THEN 1 END)::int AS accepted,
                COUNT(CASE WHEN doctor_action = 'dismissed' THEN 1 END)::int AS dismissed
         FROM copilot_insights
         WHERE doctor_id = $1 ${tenantFilter} AND created_at >= $2`,
        [doctorId, sevenDaysAgo],
      ),

      // 4. Alertas longitudinais nao lidos
      this.dataSource.query(
        `SELECT id, alert_type, title, severity, created_at
         FROM longitudinal_alerts
         WHERE doctor_id = $1 ${tenantFilter} AND read_by_doctor = false
         ORDER BY created_at DESC LIMIT 15`,
        [doctorId],
      ),

      // 5. Chats escalados
      this.dataSource.query(
        `SELECT cs.id AS session_id, cs.escalation_reason, cs.escalated_at,
                p.full_name AS patient_name, p.id AS patient_id
         FROM chat_sessions cs
         JOIN patients p ON p.id = cs.patient_id
         WHERE cs.doctor_id = $1 AND cs.escalated_to_doctor = true AND cs.status = 'escalated'
         ORDER BY cs.escalated_at DESC LIMIT 10`,
        [doctorId],
      ),

      // 6. Chat stats
      this.dataSource.query(
        `SELECT COUNT(*)::int AS message_count,
                AVG((m.metadata->>'response_time_ms')::int)::int AS avg_response_ms
         FROM chat_messages m
         JOIN chat_sessions s ON s.id = m.session_id
         WHERE s.doctor_id = $1 AND m.role = 'assistant' AND m.created_at >= $2`,
        [doctorId, sevenDaysAgo],
      ),

      // 7. Copilot check stats
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total,
                AVG(generation_time_ms)::int AS avg_gen_ms
         FROM copilot_checks
         WHERE doctor_id = $1 ${tenantFilter} AND created_at >= $2`,
        [doctorId, sevenDaysAgo],
      ),
    ]);

    // Build urgent actions
    const urgentActions = [
      ...escalatedChats.map((c: any) => ({
        type: 'escalated_chat',
        title: `${c.patient_name} relatou urgencia`,
        description: c.escalation_reason,
        severity: 'critical',
        relatedPatientId: c.patient_id,
        relatedPatientName: c.patient_name,
        createdAt: c.escalated_at,
      })),
    ];

    const insight = insightStats[0] ?? { total: 0, accepted: 0, dismissed: 0 };
    const chat = chatStats[0] ?? { message_count: 0, avg_response_ms: 0 };
    const checks = copilotCheckStats[0] ?? { total: 0, avg_gen_ms: 0 };

    return {
      urgentActions: { totalCount: urgentActions.length, items: urgentActions },
      pendingSummaries: {
        count: pendingSummaries.length,
        items: pendingSummaries.map((s: any) => ({
          id: s.id,
          patientName: s.patient_name,
          consultationDate: s.created_at,
          status: s.status,
        })),
      },
      copilotOverview: {
        unreviewedChecklists: unreviewedChecklists[0]?.count ?? 0,
        insightsGenerated: insight.total,
        insightsAccepted: insight.accepted,
        insightsDismissed: insight.dismissed,
        acceptanceRate: insight.total > 0 ? Math.round((insight.accepted / insight.total) * 100) : 0,
        totalChecks: checks.total,
        avgGenerationTimeMs: checks.avg_gen_ms ?? 0,
      },
      patientAttention: {
        escalatedChats: {
          count: escalatedChats.length,
          items: escalatedChats.map((c: any) => ({
            sessionId: c.session_id,
            patientName: c.patient_name,
            escalationReason: c.escalation_reason,
            escalatedAt: c.escalated_at,
          })),
        },
      },
      chatbotStats: {
        messagesLast7Days: chat.message_count,
        avgResponseTimeSec: Math.round((chat.avg_response_ms ?? 0) / 1000),
        escalationsLast7Days: escalatedChats.length,
      },
      longitudinalAlerts: {
        unreadCount: longitudinalAlerts.length,
        items: longitudinalAlerts.map((a: any) => ({
          id: a.id,
          type: a.alert_type,
          title: a.title,
          severity: a.severity,
          createdAt: a.created_at,
        })),
      },
    };
  }
}
