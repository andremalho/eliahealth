import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getAnalytics(
    tenantId: string | null,
    from: string,
    to: string,
    doctorId?: string,
  ) {
    const tenantFilter = tenantId ? `tenant_id = '${tenantId}'` : '1=1';
    const doctorFilter = doctorId ? `AND doctor_id = '${doctorId}'` : '';

    const [
      summaryStats,
      copilotItemStats,
      copilotTopCategories,
      insightStats,
      chatStats,
      chatPeakHours,
      longitudinalStats,
      clinicalImpact,
    ] = await Promise.all([
      this.querySummaryStats(tenantFilter, doctorFilter, from, to),
      this.queryCopilotItemStats(tenantFilter, doctorFilter, from, to),
      this.queryCopilotTopCategories(tenantFilter, doctorFilter, from, to),
      this.queryInsightStats(tenantFilter, doctorFilter, from, to),
      this.queryChatStats(tenantFilter, from, to),
      this.queryChatPeakHours(tenantFilter, from, to),
      this.queryLongitudinalStats(tenantFilter, doctorFilter, from, to),
      this.queryClinicalImpact(tenantFilter, from, to),
    ]);

    const s = summaryStats[0] ?? {};
    const totalGen = parseInt(s.total_generated ?? '0');
    const totalApproved = parseInt(s.total_approved ?? '0');
    const totalSent = parseInt(s.total_sent ?? '0');
    const totalDelivered = parseInt(s.total_delivered ?? '0');
    const totalRead = parseInt(s.total_read ?? '0');
    const totalEdited = parseInt(s.total_edited ?? '0');

    const ci = copilotItemStats[0] ?? {};
    const totalItems = parseInt(ci.total_items ?? '0');
    const ciAccepted = parseInt(ci.accepted ?? '0');

    const ins = insightStats[0] ?? {};
    const cs = chatStats[0] ?? {};
    const ls = longitudinalStats[0] ?? {};
    const imp = clinicalImpact[0] ?? {};

    return {
      period: { from, to },
      summaryMetrics: {
        totalGenerated: totalGen,
        totalApproved,
        totalSent,
        totalDelivered,
        totalRead,
        approvalRate: totalGen > 0 ? Math.round((totalApproved / totalGen) * 100) : 0,
        deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
        readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
        avgApprovalTimeMin: Math.round(parseFloat(s.avg_approval_time_min ?? '0')),
        editRate: totalApproved > 0 ? Math.round((totalEdited / totalApproved) * 100) : 0,
      },
      copilotMetrics: {
        totalItems,
        bySeverity: {
          ok: parseInt(ci.ok_count ?? '0'),
          attention: parseInt(ci.attention_count ?? '0'),
          actionRequired: parseInt(ci.action_required_count ?? '0'),
        },
        resolutionBreakdown: {
          accepted: ciAccepted,
          ignored: parseInt(ci.ignored ?? '0'),
          alreadyDone: parseInt(ci.already_done ?? '0'),
          deferred: parseInt(ci.deferred ?? '0'),
        },
        acceptanceRate: totalItems > 0 ? Math.round((ciAccepted / totalItems) * 100) : 0,
        topCategories: copilotTopCategories.map((c: any) => ({
          category: c.category,
          count: parseInt(c.count),
          acceptRate: parseInt(c.accept_rate ?? '0'),
        })),
        realtimeInsights: {
          total: parseInt(ins.total ?? '0'),
          accepted: parseInt(ins.accepted ?? '0'),
          dismissed: parseInt(ins.dismissed ?? '0'),
          noAction: parseInt(ins.no_action ?? '0'),
        },
      },
      chatMetrics: {
        totalSessions: parseInt(cs.total_sessions ?? '0'),
        totalMessages: parseInt(cs.total_messages ?? '0'),
        avgMessagesPerSession: parseFloat(cs.avg_messages ?? '0'),
        avgResponseTimeSec: Math.round(parseInt(cs.avg_response_ms ?? '0') / 1000),
        escalationRate: parseInt(cs.total_sessions ?? '0') > 0
          ? Math.round((parseInt(cs.escalations ?? '0') / parseInt(cs.total_sessions ?? '1')) * 100)
          : 0,
        peakHours: chatPeakHours.map((h: any) => ({
          hour: parseInt(h.hour),
          count: parseInt(h.count),
        })),
      },
      longitudinalMetrics: {
        totalAlerts: parseInt(ls.total ?? '0'),
        readRate: parseInt(ls.total ?? '0') > 0
          ? Math.round((parseInt(ls.read_count ?? '0') / parseInt(ls.total ?? '1')) * 100)
          : 0,
        actionRate: parseInt(ls.total ?? '0') > 0
          ? Math.round((parseInt(ls.acted_count ?? '0') / parseInt(ls.total ?? '1')) * 100)
          : 0,
      },
      clinicalImpact: {
        gapsDetectedByCopilot: parseInt(imp.gaps_detected ?? '0'),
        gapsAcceptedByDoctor: parseInt(imp.gaps_accepted ?? '0'),
        gapsCorrectionRate: parseInt(imp.gaps_detected ?? '0') > 0
          ? Math.round((parseInt(imp.gaps_accepted ?? '0') / parseInt(imp.gaps_detected ?? '1')) * 100)
          : 0,
        patientsReachedBySummary: parseInt(imp.patients_reached ?? '0'),
        patientsWhoReadSummary: parseInt(imp.patients_who_read ?? '0'),
        patientsWhoInteractedWithChat: parseInt(imp.patients_who_chatted ?? '0'),
      },
    };
  }

  private querySummaryStats(tf: string, df: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT COUNT(*)::int AS total_generated,
             COUNT(CASE WHEN status NOT IN ('draft','generating','failed') THEN 1 END)::int AS total_approved,
             COUNT(CASE WHEN status IN ('sent','delivered','read') THEN 1 END)::int AS total_sent,
             COUNT(CASE WHEN status IN ('delivered','read') THEN 1 END)::int AS total_delivered,
             COUNT(CASE WHEN status = 'read' THEN 1 END)::int AS total_read,
             COUNT(CASE WHEN original_ai_text IS DISTINCT FROM summary_text THEN 1 END)::int AS total_edited,
             AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/60) AS avg_approval_time_min
      FROM consultation_summaries WHERE ${tf} ${df} AND created_at BETWEEN $1 AND $2`,
      [from, to],
    );
  }

  private queryCopilotItemStats(tf: string, df: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT COUNT(*)::int AS total_items,
             COUNT(CASE WHEN ci.severity='ok' THEN 1 END)::int AS ok_count,
             COUNT(CASE WHEN ci.severity='attention' THEN 1 END)::int AS attention_count,
             COUNT(CASE WHEN ci.severity='action_required' THEN 1 END)::int AS action_required_count,
             COUNT(CASE WHEN ci.resolution='accepted' THEN 1 END)::int AS accepted,
             COUNT(CASE WHEN ci.resolution='ignored' THEN 1 END)::int AS ignored,
             COUNT(CASE WHEN ci.resolution='already_done' THEN 1 END)::int AS already_done,
             COUNT(CASE WHEN ci.resolution='deferred' THEN 1 END)::int AS deferred
      FROM copilot_check_items ci JOIN copilot_checks c ON ci.copilot_check_id=c.id
      WHERE ${tf.replace('tenant_id', 'c.tenant_id')} ${df.replace('doctor_id', 'c.doctor_id')}
        AND c.created_at BETWEEN $1 AND $2`,
      [from, to],
    );
  }

  private queryCopilotTopCategories(tf: string, df: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT ci.category, COUNT(*)::int AS count,
             ROUND(COUNT(CASE WHEN ci.resolution='accepted' THEN 1 END)*100.0/NULLIF(COUNT(*),0))::int AS accept_rate
      FROM copilot_check_items ci JOIN copilot_checks c ON ci.copilot_check_id=c.id
      WHERE ${tf.replace('tenant_id', 'c.tenant_id')} ${df.replace('doctor_id', 'c.doctor_id')}
        AND c.created_at BETWEEN $1 AND $2 AND ci.severity!='ok'
      GROUP BY ci.category ORDER BY count DESC LIMIT 5`,
      [from, to],
    );
  }

  private queryInsightStats(tf: string, df: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(CASE WHEN doctor_action='accepted' THEN 1 END)::int AS accepted,
             COUNT(CASE WHEN doctor_action='dismissed' THEN 1 END)::int AS dismissed,
             COUNT(CASE WHEN doctor_action IS NULL THEN 1 END)::int AS no_action
      FROM copilot_insights WHERE ${tf} ${df} AND created_at BETWEEN $1 AND $2`,
      [from, to],
    );
  }

  private queryChatStats(tf: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT (SELECT COUNT(*)::int FROM chat_sessions WHERE ${tf} AND created_at BETWEEN $1 AND $2) AS total_sessions,
             (SELECT COUNT(*)::int FROM chat_messages m JOIN chat_sessions s ON m.session_id=s.id
              WHERE ${tf.replace('tenant_id', 's.tenant_id')} AND m.created_at BETWEEN $1 AND $2) AS total_messages,
             (SELECT AVG(message_count) FROM chat_sessions WHERE ${tf} AND created_at BETWEEN $1 AND $2) AS avg_messages,
             (SELECT AVG((m.metadata->>'response_time_ms')::int) FROM chat_messages m JOIN chat_sessions s ON m.session_id=s.id
              WHERE ${tf.replace('tenant_id', 's.tenant_id')} AND m.role='assistant' AND m.created_at BETWEEN $1 AND $2) AS avg_response_ms,
             (SELECT COUNT(*)::int FROM chat_sessions WHERE ${tf} AND escalated_to_doctor=true AND created_at BETWEEN $1 AND $2) AS escalations`,
      [from, to],
    );
  }

  private queryChatPeakHours(tf: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT EXTRACT(HOUR FROM m.created_at)::int AS hour, COUNT(*)::int AS count
      FROM chat_messages m JOIN chat_sessions s ON m.session_id=s.id
      WHERE ${tf.replace('tenant_id', 's.tenant_id')} AND m.role='patient' AND m.created_at BETWEEN $1 AND $2
      GROUP BY 1 ORDER BY count DESC`,
      [from, to],
    );
  }

  private queryLongitudinalStats(tf: string, df: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(CASE WHEN read_by_doctor THEN 1 END)::int AS read_count,
             COUNT(CASE WHEN acted_upon THEN 1 END)::int AS acted_count
      FROM longitudinal_alerts WHERE ${tf} ${df} AND created_at BETWEEN $1 AND $2`,
      [from, to],
    );
  }

  private queryClinicalImpact(tf: string, from: string, to: string) {
    return this.dataSource.query(`
      SELECT
        (SELECT COUNT(*) FROM copilot_check_items ci JOIN copilot_checks c ON ci.copilot_check_id=c.id
         WHERE ${tf.replace('tenant_id', 'c.tenant_id')} AND c.created_at BETWEEN $1 AND $2 AND ci.severity='action_required')::int AS gaps_detected,
        (SELECT COUNT(*) FROM copilot_check_items ci JOIN copilot_checks c ON ci.copilot_check_id=c.id
         WHERE ${tf.replace('tenant_id', 'c.tenant_id')} AND c.created_at BETWEEN $1 AND $2 AND ci.severity='action_required' AND ci.resolution='accepted')::int AS gaps_accepted,
        (SELECT COUNT(DISTINCT patient_id) FROM consultation_summaries
         WHERE ${tf} AND created_at BETWEEN $1 AND $2 AND status IN ('sent','delivered','read'))::int AS patients_reached,
        (SELECT COUNT(DISTINCT patient_id) FROM consultation_summaries
         WHERE ${tf} AND created_at BETWEEN $1 AND $2 AND status='read')::int AS patients_who_read,
        (SELECT COUNT(DISTINCT patient_id) FROM chat_sessions
         WHERE ${tf} AND created_at BETWEEN $1 AND $2 AND message_count>0)::int AS patients_who_chatted`,
      [from, to],
    );
  }
}
